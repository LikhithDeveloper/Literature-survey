const Survey = require('../models/Survey');
const User = require('../models/User');
const logger = require('../config/logger');
const AgentOrchestrator = require('../agents/AgentOrchestrator');
const { sendSurveyCompletionEmail } = require('../utils/email');

// @desc    Create new survey
// @route   POST /api/surveys/create
// @access  Private
exports.createSurvey = async (req, res, next) => {
  try {
    const { topic, additionalInfo } = req.body;
    const userId = req.user.id;

    // Validation
    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a topic'
      });
    }

    // Process uploaded documents
    const documents = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path
    })) : [];

    // Create survey
    const survey = await Survey.create({
      userId,
      topic,
      additionalInfo: additionalInfo || '',
      documents,
      status: 'pending',
      vectorDbNamespace: `survey_${Date.now()}_${userId}`,
      estimatedCompletionTime: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    });

    logger.info(`Survey created: ${survey._id} by user: ${userId}`);

    // Start agent pipeline asynchronously
    setImmediate(() => {
      this.startAgentPipeline(survey._id, req.app.get('io'));
    });

    res.status(201).json({
      success: true,
      message: 'Survey creation initiated',
      surveyId: survey._id,
      estimatedTime: '10-15 minutes'
    });
  } catch (error) {
    logger.error(`Create survey error: ${error.message}`);
    next(error);
  }
};

// Start agent pipeline
exports.startAgentPipeline = async (surveyId, io) => {
  try {
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      logger.error(`Survey not found: ${surveyId}`);
      return;
    }

    // Update status
    survey.status = 'processing';
    await survey.save();

    // Emit initial status
    io.to(`survey_${surveyId}`).emit('progress_update', {
      surveyId: surveyId,
      status: 'processing',
      currentAgent: 'Initializing',
      progress: 0,
      message: 'Starting literature survey generation...'
    });

    // Create orchestrator
    const orchestrator = new AgentOrchestrator(survey, io);
    
    // Execute pipeline
    const result = await orchestrator.execute();

    if (result.success) {
      // Mark survey as completed
      await survey.markCompleted();

      // Send completion email
      const user = await User.findById(survey.userId);
      if (user) {
        try {
          await sendSurveyCompletionEmail(user.email, user.name, survey.topic, survey._id);
        } catch (emailError) {
          logger.error(`Error sending completion email: ${emailError.message}`);
        }
      }

      // Emit completion
      io.to(`survey_${surveyId}`).emit('survey_completed', {
        surveyId: surveyId,
        message: 'Literature survey completed successfully!',
        processingTime: survey.processingTime
      });

      logger.info(`Survey completed: ${surveyId}`);
    } else {
      throw new Error(result.error || 'Pipeline execution failed');
    }
  } catch (error) {
    logger.error(`Agent pipeline error for survey ${surveyId}: ${error.message}`);

    // Mark survey as failed
    const survey = await Survey.findById(surveyId);
    if (survey) {
      await survey.markFailed(error.message);

      // Emit error
      io.to(`survey_${surveyId}`).emit('error', {
        surveyId: surveyId,
        message: 'Survey generation failed',
        error: error.message
      });
    }
  }
};

// @desc    Get all surveys for user
// @route   GET /api/surveys
// @access  Private
exports.getSurveys = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const surveys = await Survey.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-generatedSurvey.content -documents'); // Exclude large fields

    const count = await Survey.countDocuments(query);

    res.status(200).json({
      success: true,
      surveys,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    logger.error(`Get surveys error: ${error.message}`);
    next(error);
  }
};

// @desc    Get single survey
// @route   GET /api/surveys/:id
// @access  Private
exports.getSurvey = async (req, res, next) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Check ownership
    if (survey.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this survey'
      });
    }

    res.status(200).json({
      success: true,
      survey
    });
  } catch (error) {
    logger.error(`Get survey error: ${error.message}`);
    next(error);
  }
};

// @desc    Delete survey
// @route   DELETE /api/surveys/:id
// @access  Private
exports.deleteSurvey = async (req, res, next) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Check ownership
    if (survey.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this survey'
      });
    }

    // Delete from vector DB
    const vectorDBClient = require('../config/vectorDB');
    try {
      await vectorDBClient.deleteCollection(`survey_${survey._id}`);
    } catch (error) {
      logger.error(`Error deleting vector DB collection: ${error.message}`);
    }

    // Delete uploaded files
    const { deleteFile } = require('../utils/fileProcessing');
    for (const doc of survey.documents) {
      await deleteFile(doc.path);
    }

    await survey.deleteOne();

    logger.info(`Survey deleted: ${survey._id}`);

    res.status(200).json({
      success: true,
      message: 'Survey deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete survey error: ${error.message}`);
    next(error);
  }
};

// @desc    Export survey
// @route   GET /api/surveys/:id/export
// @access  Private
exports.exportSurvey = async (req, res, next) => {
  try {
    const { format = 'pdf' } = req.query;
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Check ownership
    if (survey.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this survey'
      });
    }

    if (!survey.generatedSurvey || !survey.generatedSurvey.content) {
      return res.status(400).json({
        success: false,
        message: 'Survey not yet completed'
      });
    }

    const exportUtils = require('../utils/export');

    if (format === 'pdf') {
      const pdfBuffer = await exportUtils.exportToPDF(survey);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="survey_${survey._id}.pdf"`);
      res.send(pdfBuffer);
    } else if (format === 'docx') {
      const docxBuffer = await exportUtils.exportToDOCX(survey);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="survey_${survey._id}.docx"`);
      res.send(docxBuffer);
    } else if (format === 'markdown') {
      const markdown = exportUtils.exportToMarkdown(survey);
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="survey_${survey._id}.md"`);
      res.send(markdown);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid export format. Use pdf, docx, or markdown'
      });
    }
  } catch (error) {
    logger.error(`Export survey error: ${error.message}`);
    next(error);
  }
};

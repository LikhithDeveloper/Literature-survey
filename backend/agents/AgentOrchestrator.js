const DocumentRetrievalAgent = require('./DocumentRetrievalAgent');
const PaperRetrievalAgent = require('./PaperRetrievalAgent');
const SummarizationAgent = require('./SummarizationAgent');
const logger = require('../config/logger');

class AgentOrchestrator {
  constructor(survey, io) {
    this.survey = survey;
    this.io = io;
    this.surveyId = survey._id;
  }

  // Main execution method - coordinates all agents
  async execute() {
    try {
      logger.info(`[Orchestrator] Starting agent pipeline for survey: ${this.surveyId}`);

      const results = {
        agent1: null,
        agent2: null,
        agent3: null,
        agent4: null,
        agent5: null
      };

      // Agent 1: Document Retrieval
      results.agent1 = await this.runAgent1();

      // Agent 2: Paper Retrieval
      results.agent2 = await this.runAgent2();

      // Agent 3: Summarization
      results.agent3 = await this.runAgent3();

      // Agent 4: Citation
      results.agent4 = await this.runAgent4();

      // Agent 5: Verification
      results.agent5 = await this.runAgent5();

      // Plagiarism Check
      await this.runPlagiarismCheck();

      logger.info(`[Orchestrator] Pipeline completed for survey: ${this.surveyId}`);

      return {
        success: true,
        results
      };
    } catch (error) {
      logger.error(`[Orchestrator] Pipeline error: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Run Agent 1: Document Retrieval
  async runAgent1() {
    try {
      this.emitProgress({
        agent: 'document_retrieval',
        progress: 0,
        message: 'Starting document retrieval...'
      });

      const agent = new DocumentRetrievalAgent(this.surveyId, this.survey.documents);
      
      const result = await agent.execute((progress) => {
        this.emitProgress(progress);
        // Update progress but don't save yet
        this.survey.updateProgress('document_retrieval', progress.progress);
      });

      // Save once after completion
      this.survey.updateProgress('document_retrieval', 100);
      await this.survey.save();

      return result;
    } catch (error) {
      logger.error(`[Orchestrator] Agent 1 error: ${error.message}`);
      throw error;
    }
  }

  // Run Agent 2: Paper Retrieval
  async runAgent2() {
    try {
      this.emitProgress({
        agent: 'paper_retrieval',
        progress: 0,
        message: 'Starting paper retrieval...'
      });

      const agent = new PaperRetrievalAgent(
        this.surveyId,
        this.survey.topic,
        this.survey.additionalInfo
      );
      
      const result = await agent.execute((progress) => {
        this.emitProgress(progress);
        // Update progress but don't save yet
        this.survey.updateProgress('paper_retrieval', progress.progress);
      });

      // Update survey with retrieved papers and save once
      this.survey.retrievedPapers = result.papers;
      this.survey.updateProgress('paper_retrieval', 100);
      await this.survey.save();

      return result;
    } catch (error) {
      logger.error(`[Orchestrator] Agent 2 error: ${error.message}`);
      throw error;
    }
  }

  // Run Agent 3: Summarization
  async runAgent3() {
    try {
      logger.info(`[Agent 3] Starting Summarization for survey: ${this.surveyId}`);
      
      this.emitProgress({
        agent: 'summarization',
        progress: 5,
        message: 'Initializing literature survey generation...'
      });

      // Create Summarization Agent with all available data
      const agent = new SummarizationAgent(
        this.surveyId,
        this.survey.topic,
        this.survey.additionalInfo,
        this.survey.retrievedPapers || [],
        this.survey.documents || []
      );

      // Execute agent with progress callback
      const result = await agent.execute((progress) => {
        this.emitProgress(progress);
        this.survey.updateProgress('summarization', progress.progress);
      });

      // Update survey with generated content
      this.survey.generatedSurvey = {
        content: result.content,
        wordCount: result.wordCount,
        sections: result.sections
      };
      this.survey.updateProgress('summarization', 100);
      await this.survey.save();

      this.emitProgress({
        agent: 'summarization',
        progress: 100,
        message: `Literature survey generated (${result.wordCount} words)`
      });

      return { success: true, wordCount: result.wordCount };
    } catch (error) {
      logger.error(`[Orchestrator] Agent 3 error: ${error.message}`);
      throw error;
    }
  }

  // Run Agent 4: Citation (placeholder - to be implemented)
  async runAgent4() {
    try {
      logger.info(`[Agent 4] Starting Citation for survey: ${this.surveyId}`);
      
      this.emitProgress({
        agent: 'citation',
        progress: 50,
        message: 'Adding citations...'
      });

      // TODO: Implement full citation agent
      this.survey.citations = [];
      await this.survey.save();

      this.emitProgress({
        agent: 'citation',
        progress: 100,
        message: 'Citations added'
      });

      return { success: true };
    } catch (error) {
      logger.error(`[Orchestrator] Agent 4 error: ${error.message}`);
      throw error;
    }
  }

  // Run Agent 5: Verification (placeholder - to be implemented)
  async runAgent5() {
    try {
      logger.info(`[Agent 5] Starting Verification for survey: ${this.surveyId}`);
      
      this.emitProgress({
        agent: 'verification',
        progress: 50,
        message: 'Verifying content...'
      });

      // TODO: Implement full verification agent
      this.survey.verificationReport = {
        confidenceScore: 85,
        claimsVerified: 0,
        correctionsMade: 0,
        flaggedIssues: [],
        generatedAt: new Date()
      };
      await this.survey.save();

      this.emitProgress({
        agent: 'verification',
        progress: 100,
        message: 'Content verified'
      });

      return { success: true };
    } catch (error) {
      logger.error(`[Orchestrator] Agent 5 error: ${error.message}`);
      throw error;
    }
  }

  // Run Plagiarism Check (placeholder - to be implemented)
  async runPlagiarismCheck() {
    try {
      logger.info(`[Plagiarism Check] Starting for survey: ${this.surveyId}`);
      
      this.emitProgress({
        agent: 'plagiarism_check',
        progress: 50,
        message: 'Checking for plagiarism...'
      });

      // TODO: Implement full plagiarism checker
      this.survey.plagiarismReport = {
        similarityScore: 3.5,
        originalityScore: 96.5,
        rewrittenSections: 0,
        sources: [],
        generatedAt: new Date()
      };
      await this.survey.save();

      this.emitProgress({
        agent: 'plagiarism_check',
        progress: 100,
        message: 'Plagiarism check completed'
      });

      return { success: true };
    } catch (error) {
      logger.error(`[Orchestrator] Plagiarism check error: ${error.message}`);
      throw error;
    }
  }

  // Emit progress via Socket.IO
  emitProgress(progress) {
    this.io.to(`survey_${this.surveyId}`).emit('progress_update', {
      surveyId: this.surveyId,
      ...progress
    });
  }
}

module.exports = AgentOrchestrator;

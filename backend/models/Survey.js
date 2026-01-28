const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  topic: {
    type: String,
    required: [true, 'Please provide a topic'],
    trim: true,
    minlength: 10,
    maxlength: 200
  },
  additionalInfo: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  currentAgent: {
    type: String,
    enum: ['', 'document_retrieval', 'paper_retrieval', 'summarization', 'citation', 'verification', 'plagiarism_check'],
    default: ''
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  documents: [{
    filename: String,
    originalName: String,
    size: Number,
    mimetype: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    path: String
  }],
  retrievedPapers: [{
    title: String,
    authors: [String],
    year: Number,
    source: {
      type: String,
      enum: ['arxiv', 'semantic_scholar', 'pubmed', 'google_scholar', 'uploaded']
    },
    doi: String,
    url: String,
    abstract: String,
    pdfUrl: String
  }],
  generatedSurvey: {
    content: String,
    wordCount: Number,
    sections: [{
      title: String,
      content: String,
      order: Number
    }]
  },
  citations: [{
    citationKey: String,
    formattedCitation: String,
    sourceId: String,
    citationType: {
      type: String,
      enum: ['APA', 'IEEE', 'MLA', 'Chicago'],
      default: 'APA'
    }
  }],
  verificationReport: {
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100
    },
    claimsVerified: Number,
    correctionsMade: Number,
    flaggedIssues: [String],
    generatedAt: Date
  },
  plagiarismReport: {
    similarityScore: {
      type: Number,
      min: 0,
      max: 100
    },
    originalityScore: {
      type: Number,
      min: 0,
      max: 100
    },
    rewrittenSections: Number,
    sources: [{
      text: String,
      similarity: Number,
      source: String
    }],
    generatedAt: Date
  },
  vectorDbNamespace: {
    type: String,
    unique: true,
    sparse: true
  },
  estimatedCompletionTime: Date,
  completedAt: Date,
  errorMessage: String,
  processingTime: Number, // in seconds
}, {
  timestamps: true
});

// Index for faster queries
surveySchema.index({ userId: 1, createdAt: -1 });
surveySchema.index({ status: 1, createdAt: -1 });

// Virtual for formatted creation date
surveySchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Method to update progress (without saving - call save() manually when needed)
surveySchema.methods.updateProgress = function(agent, progress) {
  this.currentAgent = agent;
  this.progress = progress;
  // Don't auto-save to prevent parallel save conflicts
};

// Method to mark as completed
surveySchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.progress = 100;
  this.completedAt = new Date();
  this.processingTime = Math.floor((this.completedAt - this.createdAt) / 1000);
  return this.save();
};

// Method to mark as failed
surveySchema.methods.markFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  return this.save();
};

module.exports = mongoose.model('Survey', surveySchema);

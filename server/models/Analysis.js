const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    anatomicalRegion: {
      type: String,
      default: null,
    },
    verdict: {
      type: String,
      enum: ['supported', 'uncertain', 'hallucinated'],
      default: 'uncertain',
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    confidenceInterval: {
      type: Number,
      default: null,
    },
    explanation: {
      type: String,
      default: null,
    },
    boundingBox: {
      x: { type: Number, default: null },
      y: { type: Number, default: null },
      width: { type: Number, default: null },
      height: { type: Number, default: null },
    },
  },
  { _id: true }
);

const consistencyViolationSchema = new mongoose.Schema(
  {
    findingsSentence: {
      type: String,
      required: true,
    },
    impressionSentence: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      default: null,
    },
  },
  { _id: true }
);

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    originalReportText: {
      type: String,
      required: true,
    },
    claims: [claimSchema],
    consistencyViolations: [consistencyViolationSchema],
    reliabilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    correctedReportText: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: [
        'processing',
        'extracting_claims',
        'detecting_hallucinations',
        'checking_consistency',
        'complete',
        'failed',
      ],
      default: 'processing',
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

analysisSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Analysis', analysisSchema);
const mongoose = require('mongoose');

const annotationSchema = new mongoose.Schema(
  {
    analysis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Analysis',
      required: true,
    },
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    clinician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['confirmed', 'dismissed', 'needs_review'],
      required: true,
    },
    note: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

annotationSchema.index({ analysis: 1 });

module.exports = mongoose.model('Annotation', annotationSchema);
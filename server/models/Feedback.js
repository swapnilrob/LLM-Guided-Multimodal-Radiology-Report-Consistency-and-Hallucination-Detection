const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    verdict: {
      type: String,
      enum: ['thumbs_up', 'thumbs_down'],
      required: true,
    },
    correctionText: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.index({ analysis: 1 });
feedbackSchema.index({ verdict: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
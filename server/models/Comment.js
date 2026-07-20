const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    analysis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Analysis',
      required: true,
    },
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ analysis: 1 });

module.exports = mongoose.model('Comment', commentSchema);
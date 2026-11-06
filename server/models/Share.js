const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema(
  {
    analysis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Analysis',
      required: true,
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sharedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    accessLevel: {
      type: String,
      enum: ['view', 'comment'],
      default: 'view',
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

shareSchema.index({ token: 1 });
shareSchema.index({ analysis: 1 });
shareSchema.index({ sharedWith: 1 });

module.exports = mongoose.model('Share', shareSchema);
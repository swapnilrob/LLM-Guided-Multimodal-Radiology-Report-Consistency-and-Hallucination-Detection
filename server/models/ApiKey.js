const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    keyHash: {
      type: String,
      required: true,
    },
    keyPrefix: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    scopes: {
      type: [String],
      enum: ['read:analyses', 'write:analyses', 'read:teams'],
      default: ['read:analyses'],
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
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

apiKeySchema.index({ keyHash: 1 });
apiKeySchema.index({ user: 1 });

module.exports = mongoose.model('ApiKey', apiKeySchema);
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    device: {
      type: String,
      default: 'Unknown device',
    },
    ipAddress: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: 'Unknown location',
    },
    lastActive: {
      type: Date,
      default: Date.now,
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

sessionSchema.index({ user: 1 });

module.exports = mongoose.model('Session', sessionSchema);
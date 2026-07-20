const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    targetRoles: [
      {
        type: String,
        enum: ['general_user', 'clinician', 'admin'],
      },
    ],
    scheduledDisplayDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

announcementSchema.index({ scheduledDisplayDate: 1, expiryDate: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
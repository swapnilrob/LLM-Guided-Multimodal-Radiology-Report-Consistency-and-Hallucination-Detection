const Analysis = require('../models/Analysis');
const User = require('../models/User');
const { uploadImage } = require('../services/cloudinaryService');
const { encrypt } = require('../utils/encryption');
const { logAction } = require('../utils/auditLogger');

// --- Create a new analysis (upload image + report text) ---
const createAnalysis = async (req, res, next) => {
  try {
    // 1. Validate that a report text was provided
    const { reportText } = req.body;
    if (!reportText || reportText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Report text is required',
      });
    }

    // 2. Validate that an image file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'An X-ray image file is required',
      });
    }

    // 3. Upload the image to Cloudinary
    const uploadResult = await uploadImage(req.file.buffer);

    // 4. Encrypt the report text before storing
    const encryptedReport = encrypt(reportText);

    // 5. Create the Analysis document
    const analysis = await Analysis.create({
      user: req.user._id,
      imageUrl: uploadResult.secure_url,
      originalReportText: encryptedReport,
      status: 'processing',
    });

    // 6. Log the action
    await logAction({
      actionType: 'analysis_created',
      user: req.user._id,
      ipAddress: req.ip,
      details: { analysisId: analysis._id },
    });

    // 7. Respond
    res.status(201).json({
      success: true,
      message: 'Analysis created and queued for processing',
      analysis: {
        id: analysis._id,
        imageUrl: analysis.imageUrl,
        status: analysis.status,
        createdAt: analysis.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createAnalysis };
const crypto = require('crypto');
const Analysis = require('../models/Analysis');
const Share = require('../models/Share');
const Feedback = require('../models/Feedback');
const Annotation = require('../models/Annotation');
const User = require('../models/User');
const { logAction } = require('../utils/auditLogger');
const { decrypt } = require('../utils/encryption');

// ===================== F40 — REPORT SHARING =====================

// POST /api/collaboration/share
const shareAnalysis = async (req, res, next) => {
  try {
    const { analysisId, sharedWithEmail, accessLevel, expiryDays } = req.body;

    // Validate
    if (!analysisId) {
      return res.status(400).json({ success: false, message: 'analysisId is required' });
    }

    // Verify the analysis belongs to the current user
    const analysis = await Analysis.findOne({ _id: analysisId, user: req.user._id });
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis not found' });
    }

    // If an email was provided, find that user
    let sharedWithUser = null;
    if (sharedWithEmail) {
      sharedWithUser = await User.findOne({ email: sharedWithEmail.toLowerCase() });
      if (!sharedWithUser) {
        return res.status(404).json({ success: false, message: 'User not found with that email' });
      }
      if (sharedWithUser._id.equals(req.user._id)) {
        return res.status(400).json({ success: false, message: 'You cannot share with yourself' });
      }
    }

    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Calculate expiry (default 7 days)
    const days = [1, 7, 30].includes(expiryDays) ? expiryDays : 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const share = await Share.create({
      analysis: analysisId,
      sharedBy: req.user._id,
      sharedWith: sharedWithUser?._id || null,
      accessLevel: accessLevel === 'comment' ? 'comment' : 'view',
      token,
      expiresAt,
    });

    await logAction({
      actionType: 'analysis_shared',
      user: req.user._id,
      ipAddress: req.ip,
      details: { analysisId, sharedWithEmail, accessLevel: share.accessLevel, expiryDays: days },
    });

    res.status(201).json({
      success: true,
      share: {
        id: share._id,
        token: share.token,
        accessLevel: share.accessLevel,
        expiresAt: share.expiresAt,
        shareLink: `${process.env.CLIENT_URL || 'http://localhost:3000'}/shared/${token}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/collaboration/shared/:token — access a shared analysis
const getSharedAnalysis = async (req, res, next) => {
  try {
    const share = await Share.findOne({ token: req.params.token })
      .populate('sharedBy', 'fullName email');

    if (!share) {
      return res.status(404).json({ success: false, message: 'Share link not found' });
    }

    if (share.revoked) {
      return res.status(403).json({ success: false, message: 'This share link has been revoked' });
    }

    if (new Date() > share.expiresAt) {
      return res.status(403).json({ success: false, message: 'This share link has expired' });
    }

    // If share is restricted to a specific user, check auth
    if (share.sharedWith && req.user && !share.sharedWith.equals(req.user._id) && !share.sharedBy._id.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this shared analysis' });
    }

    const analysis = await Analysis.findById(share.analysis);
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis no longer exists' });
    }

    // Decrypt the report text
    const decryptedReport = decrypt(analysis.originalReportText);

    res.status(200).json({
      success: true,
      accessLevel: share.accessLevel,
      sharedBy: share.sharedBy,
      analysis: {
        ...analysis.toObject(),
        originalReportText: decryptedReport,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/collaboration/shares/:analysisId — list all shares for an analysis
const getSharesForAnalysis = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({ _id: req.params.analysisId, user: req.user._id });
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis not found' });
    }

    const shares = await Share.find({ analysis: req.params.analysisId, revoked: false })
      .populate('sharedWith', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, shares });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/collaboration/share/:shareId/revoke
const revokeShare = async (req, res, next) => {
  try {
    const share = await Share.findById(req.params.shareId);
    if (!share) {
      return res.status(404).json({ success: false, message: 'Share not found' });
    }

    // Only the person who shared can revoke
    if (!share.sharedBy.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the owner can revoke a share' });
    }

    share.revoked = true;
    await share.save();

    res.status(200).json({ success: true, message: 'Share link revoked' });
  } catch (error) {
    next(error);
  }
};

// GET /api/collaboration/shared-with-me — analyses shared with current user
const getSharedWithMe = async (req, res, next) => {
  try {
    const shares = await Share.find({
      sharedWith: req.user._id,
      revoked: false,
      expiresAt: { $gt: new Date() },
    })
      .populate('sharedBy', 'fullName email')
      .populate('analysis', 'reliabilityScore status createdAt imageUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, shares });
  } catch (error) {
    next(error);
  }
};

// ===================== F44 — AI VERDICT FEEDBACK =====================

// POST /api/collaboration/feedback
const submitFeedback = async (req, res, next) => {
  try {
    const { analysisId, claimId, verdict, correctionText } = req.body;

    if (!analysisId || !claimId || !verdict) {
      return res.status(400).json({ success: false, message: 'analysisId, claimId, and verdict are required' });
    }

    if (!['thumbs_up', 'thumbs_down'].includes(verdict)) {
      return res.status(400).json({ success: false, message: 'verdict must be thumbs_up or thumbs_down' });
    }

    // Check that the analysis exists
    const analysis = await Analysis.findById(analysisId);
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis not found' });
    }

    // Upsert — one feedback per user per claim
    const feedback = await Feedback.findOneAndUpdate(
      { analysis: analysisId, claimId, user: req.user._id },
      {
        analysis: analysisId,
        claimId,
        user: req.user._id,
        verdict,
        correctionText: correctionText || null,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ success: true, feedback });
  } catch (error) {
    next(error);
  }
};

// GET /api/collaboration/feedback/:analysisId — get all feedback for an analysis
const getFeedback = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ analysis: req.params.analysisId })
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, feedbacks });
  } catch (error) {
    next(error);
  }
};

// ===================== F41 — CLINICIAN ANNOTATIONS =====================

// POST /api/collaboration/annotations
const createAnnotation = async (req, res, next) => {
  try {
    const { analysisId, claimId, status, note } = req.body;

    if (!analysisId || !claimId || !status) {
      return res.status(400).json({ success: false, message: 'analysisId, claimId, and status are required' });
    }

    if (!['confirmed', 'dismissed', 'needs_review'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be confirmed, dismissed, or needs_review' });
    }

    const analysis = await Analysis.findById(analysisId);
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis not found' });
    }

    // Upsert — one annotation per clinician per claim
    const annotation = await Annotation.findOneAndUpdate(
      { analysis: analysisId, claimId, clinician: req.user._id },
      {
        analysis: analysisId,
        claimId,
        clinician: req.user._id,
        status,
        note: note || null,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ success: true, annotation });
  } catch (error) {
    next(error);
  }
};

// GET /api/collaboration/annotations/:analysisId
const getAnnotations = async (req, res, next) => {
  try {
    const annotations = await Annotation.find({ analysis: req.params.analysisId })
      .populate('clinician', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, annotations });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  shareAnalysis,
  getSharedAnalysis,
  getSharesForAnalysis,
  revokeShare,
  getSharedWithMe,
  submitFeedback,
  getFeedback,
  createAnnotation,
  getAnnotations,
};
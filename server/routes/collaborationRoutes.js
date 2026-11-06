const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  shareAnalysis,
  getSharedAnalysis,
  getSharesForAnalysis,
  revokeShare,
  getSharedWithMe,
  submitFeedback,
  getFeedback,
  createAnnotation,
  getAnnotations,
} = require('../controllers/collaborationController');

// --- F40: Report Sharing ---
router.post('/share', protect, shareAnalysis);
router.get('/shared/:token', getSharedAnalysis);          // no auth required — token is the auth
router.get('/shares/:analysisId', protect, getSharesForAnalysis);
router.patch('/share/:shareId/revoke', protect, revokeShare);
router.get('/shared-with-me', protect, getSharedWithMe);

// --- F44: AI Verdict Feedback ---
router.post('/feedback', protect, submitFeedback);
router.get('/feedback/:analysisId', protect, getFeedback);

// --- F41: Clinician Annotations ---
router.post('/annotations', protect, restrictTo('clinician', 'admin'), createAnnotation);
router.get('/annotations/:analysisId', protect, getAnnotations);

module.exports = router;
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  getMetrics,
  getAllUsers,
  updateUserRole,
  suspendUser,
  deleteUser,
  getAuditLogs,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getModelConfig,
  updateModelConfig,
  updateUserQuota,
  getFeedback,
  getResearchExport,
} = require('../controllers/adminController');

// All admin routes require login AND admin role
router.use(protect);
router.use(restrictTo('admin'));

// ── F32 — System Metrics ────────────────────────────────────
router.get('/metrics', getMetrics);

// ── F33 — User Management ───────────────────────────────────
router.get('/users',                getAllUsers);
router.patch('/users/:id/role',     updateUserRole);
router.patch('/users/:id/suspend',  suspendUser);
router.delete('/users/:id',         deleteUser);

// ── F35 — Audit Logs ────────────────────────────────────────
router.get('/audit-logs', getAuditLogs);

// ── F37 — Announcements ─────────────────────────────────────
router.get('/announcements',        getAnnouncements);
router.post('/announcements',       createAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// ── F34 — Model Config ──────────────────────────────────────
router.get('/model-config', getModelConfig);
router.put('/model-config',  updateModelConfig);

// ── F36 — Quota ─────────────────────────────────────────────
router.patch('/users/:id/quota', updateUserQuota);

// ── F38 — Feedback ──────────────────────────────────────────
router.get('/feedback', getFeedback);

// ── F39 — Research Export ───────────────────────────────────
router.get('/research-export', getResearchExport);

module.exports = router;
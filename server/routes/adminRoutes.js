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
router.get('/announcements',         getAnnouncements);
router.post('/announcements',        createAnnouncement);
router.delete('/announcements/:id',  deleteAnnouncement);
 
module.exports = router;
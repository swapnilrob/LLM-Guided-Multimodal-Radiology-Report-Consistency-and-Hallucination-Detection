const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Analysis = require('../models/Analysis');
const Session = require('../models/Session');
const Announcement = require('../models/Announcement');
const { logAction } = require('../utils/auditLogger');
const os = require('os');

// ── F32 — System Metrics ────────────────────────────────────
const getMetrics = async (req, res, next) => {
  try {
    const totalUsers      = await User.countDocuments();
    const activeSessions  = await Session.countDocuments();
    const totalAnalyses   = await Analysis.countDocuments();

    // Analyses created today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const analysesToday = await Analysis.countDocuments({
      createdAt: { $gte: startOfDay },
    });

    // Users who logged in today
    const activeToday = await User.countDocuments({
      lastLogin: { $gte: startOfDay },
    });

    // Average reliability score across completed analyses
    const scoreAgg = await Analysis.aggregate([
      { $match: { status: 'complete', reliabilityScore: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: '$reliabilityScore' } } },
    ]);
    const avgReliabilityScore = scoreAgg[0]
      ? Math.round(scoreAgg[0].avg)
      : 0;

    // Server uptime in a readable format
    const uptimeSeconds = process.uptime();
    const hours   = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptime  = `${hours}h ${minutes}m`;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeToday,
        activeSessions,
        totalAnalyses,
        analysesToday,
        avgReliabilityScore,
        serverStatus: 'Online',
        nodeVersion: process.version,
        uptime,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── F33 — Get All Users ─────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const { search } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email:    { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password -twoFactorSecret')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// ── F33 — Update User Role ──────────────────────────────────
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['general_user', 'clinician', 'admin'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be general_user, clinician, or admin',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logAction({
      actionType: 'role_change',
      user: req.user._id,
      ipAddress: req.ip,
      details: { targetUser: req.params.id, newRole: role },
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ── F33 — Suspend / Unsuspend User ──────────────────────────
const suspendUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Toggle suspension
    const newStatus = user.accountStatus === 'active' ? 'suspended' : 'active';
    user.accountStatus = newStatus;
    await user.save();

    await logAction({
      actionType: 'user_suspended',
      user: req.user._id,
      ipAddress: req.ip,
      details: { targetUser: req.params.id, newStatus },
    });

    res.status(200).json({
      success: true,
      data: { accountStatus: newStatus },
      message: `User ${newStatus === 'suspended' ? 'suspended' : 'unsuspended'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// ── F33 — Delete User ───────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logAction({
      actionType: 'user_deleted',
      user: req.user._id,
      ipAddress: req.ip,
      details: { deletedUser: req.params.id, email: user.email },
    });

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ── F35 — Get Audit Logs ────────────────────────────────────
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, search, limit = 100 } = req.query;

    const query = {};
    if (action) query.actionType = action;

    const logs = await AuditLog.find(query)
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    // Apply search filter on populated data
    const filtered = search
      ? logs.filter((l) =>
          l.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          l.ipAddress?.includes(search) ||
          l.actionType?.toLowerCase().includes(search.toLowerCase())
        )
      : logs;

    res.status(200).json({ success: true, data: filtered });
  } catch (error) {
    next(error);
  }
};

// ── F37 — Get Announcements ─────────────────────────────────
const getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: announcements });
  } catch (error) {
    next(error);
  }
};

// ── F37 — Create Announcement ───────────────────────────────
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, body, targetRole, expiresAt } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required',
      });
    }

    const announcement = await Announcement.create({
      title,
      body,
      targetRole: targetRole || 'all',
      expiresAt: expiresAt || null,
      createdBy: req.user._id,
    });

    await logAction({
      actionType: 'announcement_created',
      user: req.user._id,
      ipAddress: req.ip,
      details: { title },
    });

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
};

// ── F37 — Delete Announcement ───────────────────────────────
const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMetrics,
  getAllUsers,
  updateUserRole,
  suspendUser,
  deleteUser,
  getAuditLogs,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
};

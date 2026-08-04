const Session = require('../models/Session');
const { logAction } = require('../utils/auditLogger');

// --- Get all active (non-revoked) sessions for the logged-in user ---
const getMySessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({
      user: req.user._id,
      revoked: false,
    }).sort({ lastActive: -1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    next(error);
  }
};

// --- Revoke a specific session by its ID ---
const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      user: req.user._id, // ensures users can only revoke their OWN sessions
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    session.revoked = true;
    await session.save();

    await logAction({
      actionType: 'session_revoked',
      user: req.user._id,
      ipAddress: req.ip,
      details: { sessionId },
    });

    res.status(200).json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMySessions, revokeSession };
const AuditLog = require('../models/AuditLog');

/**
 * Records an action to the audit log.
 * Designed to never throw — audit logging should never break the main flow.
 */
const logAction = async ({ actionType, user = null, ipAddress = null, details = {} }) => {
  try {
    await AuditLog.create({
      actionType,
      user,
      ipAddress,
      details,
    });
  } catch (error) {
    // Log to console but don't disrupt the request that triggered this
    console.error('Failed to write audit log:', error.message);
  }
};

module.exports = { logAction };
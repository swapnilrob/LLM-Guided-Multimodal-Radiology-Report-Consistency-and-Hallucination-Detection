const crypto = require('crypto');
const ApiKey = require('../models/ApiKey');
const User = require('../models/User');

/**
 * Middleware that authenticates requests using an API key in the
 * x-api-key header. Attaches req.user and req.apiKeyScopes.
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    const rawKey = req.headers['x-api-key'];

    if (!rawKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required. Pass it in the x-api-key header.',
      });
    }

    // Hash the key to look it up
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await ApiKey.findOne({ keyHash, revoked: false });

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or revoked API key.',
      });
    }

    // Check expiry
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return res.status(401).json({
        success: false,
        message: 'API key has expired.',
      });
    }

    // Get the user
    const user = await User.findById(apiKey.user).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'API key owner not found.',
      });
    }

    // Update last used
    apiKey.lastUsedAt = new Date();
    await apiKey.save();

    // Attach to request
    req.user = user;
    req.apiKeyScopes = apiKey.scopes;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware factory that checks if the API key has the required scope.
 */
const requireScope = (...requiredScopes) => {
  return (req, res, next) => {
    if (!req.apiKeyScopes) {
      return res.status(403).json({
        success: false,
        message: 'No API key scopes found.',
      });
    }

    const hasScope = requiredScopes.some((scope) =>
      req.apiKeyScopes.includes(scope)
    );

    if (!hasScope) {
      return res.status(403).json({
        success: false,
        message: `Insufficient scope. Required: ${requiredScopes.join(' or ')}`,
      });
    }

    next();
  };
};

module.exports = { authenticateApiKey, requireScope };
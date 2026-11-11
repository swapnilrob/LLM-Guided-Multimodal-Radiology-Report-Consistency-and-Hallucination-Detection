const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const ApiKey = require('../models/ApiKey');

// POST /api/api-keys — generate a new API key
const generateApiKey = async (req, res, next) => {
  try {
    const { name, scopes, expiryDays } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'API key name is required.',
      });
    }

    // Generate the raw key
    const rawKey = `rh_${uuidv4().replace(/-/g, '')}`;
    const keyPrefix = rawKey.substring(0, 10);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    // Validate scopes
    const validScopes = ['read:analyses', 'write:analyses', 'read:teams'];
    const finalScopes = (scopes || ['read:analyses']).filter((s) =>
      validScopes.includes(s)
    );

    if (finalScopes.length === 0) {
      finalScopes.push('read:analyses');
    }

    // Calculate expiry
    let expiresAt = null;
    if (expiryDays && [30, 90, 365].includes(expiryDays)) {
      expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    }

    const apiKey = await ApiKey.create({
      user: req.user._id,
      keyHash,
      keyPrefix,
      name: name.trim(),
      scopes: finalScopes,
      expiresAt,
    });

    // Return the raw key ONLY on creation — it cannot be retrieved again
    res.status(201).json({
      success: true,
      message: 'API key created. Copy it now — it will not be shown again.',
      apiKey: {
        id: apiKey._id,
        name: apiKey.name,
        key: rawKey,
        prefix: keyPrefix,
        scopes: apiKey.scopes,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/api-keys — list the user's API keys (without the raw key)
const getMyApiKeys = async (req, res, next) => {
  try {
    const keys = await ApiKey.find({ user: req.user._id })
      .select('-keyHash')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, apiKeys: keys });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/api-keys/:keyId/revoke — revoke an API key
const revokeApiKey = async (req, res, next) => {
  try {
    const apiKey = await ApiKey.findOne({
      _id: req.params.keyId,
      user: req.user._id,
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found.',
      });
    }

    apiKey.revoked = true;
    await apiKey.save();

    res.status(200).json({ success: true, message: 'API key revoked.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateApiKey, getMyApiKeys, revokeApiKey };
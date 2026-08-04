const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const { logAction } = require('../utils/auditLogger');

// --- Step 1: Generate a secret and QR code for the user to scan ---
const setup2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate a new TOTP secret
    const secret = speakeasy.generateSecret({
      name: `RadiologyDetector (${user.email})`,
    });

    // Temporarily store the secret (not yet enabled until verified)
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate a QR code image (data URL) from the secret's otpauth URL
    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    

    res.status(200).json({
      success: true,
      qrCode: qrCodeDataUrl,
      secret: secret.base32, // shown as a manual-entry fallback
    });
  } catch (error) {
    next(error);
  }
};

// --- Step 2: Verify the first code to actually enable 2FA ---
const verify2FASetup = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification code is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ success: false, message: 'No 2FA setup in progress' });
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    user.twoFactorEnabled = true;
    await user.save();

    await logAction({
      actionType: '2fa_enabled',
      user: user._id,
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: 'Two-factor authentication enabled' });
  } catch (error) {
    next(error);
  }
};

// --- Disable 2FA ---
const disable2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();

    await logAction({
      actionType: '2fa_disabled',
      user: user._id,
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: 'Two-factor authentication disabled' });
  } catch (error) {
    next(error);
  }
};

module.exports = { setup2FA, verify2FASetup, disable2FA };
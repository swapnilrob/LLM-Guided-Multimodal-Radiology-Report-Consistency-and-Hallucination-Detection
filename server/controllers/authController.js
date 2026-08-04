const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const speakeasy = require('speakeasy');
const { logAction } = require('../utils/auditLogger');

// --- Helper functions to generate tokens ---
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

const sendRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

// --- Register ---
const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are all required',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const user = await User.create({ fullName, email, password });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    sendRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// --- Login ---
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'This account is not active',
      });
    }
    // --- 2FA check ---
    if (user.twoFactorEnabled) {
      const { twoFactorToken } = req.body;

      // No code provided yet — tell the frontend to prompt for it
      if (!twoFactorToken) {
        return res.status(200).json({
          success: true,
          twoFactorRequired: true,
          message: 'Two-factor authentication code required',
        });
      }

      // Code provided — verify it
      const isValid2FA = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorToken,
        window: 1,
      });

      if (!isValid2FA) {
        return res.status(401).json({
          success: false,
          message: 'Invalid two-factor authentication code',
        });
      }
    }
    user.lastLogin = new Date();
    await user.save();

    await Session.create({
      user: user._id,
      ipAddress: req.ip,
      device: req.headers['user-agent'] || 'Unknown device',
    });
    
    await logAction({
      actionType: 'login',
      user: user._id,
      ipAddress: req.ip,
      details: { email: user.email },
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    sendRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// --- Refresh Token ---
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided',
      });
    }

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token',
        });
      }
      const newAccessToken = generateAccessToken(decoded.id);
      res.status(200).json({ success: true, accessToken: newAccessToken });
    });
  } catch (error) {
    next(error);
  }
};

// --- Logout ---
const logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// --- Get Current User (protected route example) ---
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refreshToken, logout, getMe };
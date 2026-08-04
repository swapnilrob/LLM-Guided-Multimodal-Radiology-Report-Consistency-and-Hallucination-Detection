const express = require('express');
const router = express.Router();
const { register, login, refreshToken, logout, getMe } = require('../controllers/authController');
const { setup2FA, verify2FASetup, disable2FA } = require('../controllers/twoFactorController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);

// 2FA routes (all require the user to be logged in first)
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FASetup);
router.post('/2fa/disable', protect, disable2FA);

module.exports = router;
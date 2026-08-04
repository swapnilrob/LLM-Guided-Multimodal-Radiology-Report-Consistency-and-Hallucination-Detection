const express = require('express');
const router = express.Router();
const { getMySessions, revokeSession } = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMySessions);
router.delete('/:sessionId', protect, revokeSession);

module.exports = router;
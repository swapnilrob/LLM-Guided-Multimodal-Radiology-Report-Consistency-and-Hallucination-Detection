const express = require('express');
const router = express.Router();
const { createAnalysis } = require('../controllers/analysisController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadValidator');

router.post('/', protect, upload.single('image'), createAnalysis);

module.exports = router;
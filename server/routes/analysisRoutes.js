const express = require('express');
const router = express.Router();
const { createAnalysis, getMyAnalyses, getAnalysisById, deleteAnalysis } = require('../controllers/analysisController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadValidator');

router.post('/', protect, upload.single('image'), createAnalysis);
router.get('/', protect, getMyAnalyses);
router.get('/:id', protect, getAnalysisById);
router.delete('/:id', protect, deleteAnalysis);

module.exports = router;
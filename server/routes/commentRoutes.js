const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createComment, getComments, deleteComment } = require('../controllers/commentController');

router.post('/', protect, createComment);
router.get('/:analysisId', protect, getComments);
router.delete('/:commentId', protect, deleteComment);

module.exports = router;
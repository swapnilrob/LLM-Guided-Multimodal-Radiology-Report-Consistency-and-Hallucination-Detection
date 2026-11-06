const Comment = require('../models/Comment');
const Analysis = require('../models/Analysis');

// POST /api/comments
const createComment = async (req, res, next) => {
  try {
    const { analysisId, claimId, text, parentComment, mentions } = req.body;

    if (!analysisId || !text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'analysisId and text are required' });
    }

    const analysis = await Analysis.findById(analysisId);
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis not found' });
    }

    const comment = await Comment.create({
      analysis: analysisId,
      claimId: claimId || null,
      author: req.user._id,
      text: text.trim(),
      parentComment: parentComment || null,
      mentions: mentions || [],
    });

    // Populate author for the response
    const populated = await Comment.findById(comment._id)
      .populate('author', 'fullName email')
      .populate('parentComment');

    // Emit via WebSocket if io is available
    const io = req.app.get('io');
    if (io) {
      io.to(`analysis:${analysisId}`).emit('new_comment', populated);
    }

    res.status(201).json({ success: true, comment: populated });
  } catch (error) {
    next(error);
  }
};

// GET /api/comments/:analysisId
const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ analysis: req.params.analysisId })
      .populate('author', 'fullName email')
      .populate('mentions', 'fullName email')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, comments });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/comments/:commentId
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Only author can delete
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own comments' });
    }

    const analysisId = comment.analysis;
    await Comment.findByIdAndDelete(req.params.commentId);

    // Also delete child comments
    await Comment.deleteMany({ parentComment: req.params.commentId });

    const io = req.app.get('io');
    if (io) {
      io.to(`analysis:${analysisId}`).emit('delete_comment', { commentId: req.params.commentId });
    }

    res.status(200).json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createComment, getComments, deleteComment };
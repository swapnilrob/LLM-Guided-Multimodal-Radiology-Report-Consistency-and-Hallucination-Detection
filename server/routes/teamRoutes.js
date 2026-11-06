const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createTeam,
  joinTeam,
  getMyTeams,
  getTeamById,
  getTeamAnalyses,
  removeMember,
  leaveTeam,
} = require('../controllers/teamController');

router.post('/', protect, createTeam);
router.post('/join', protect, joinTeam);
router.get('/', protect, getMyTeams);
router.get('/:teamId', protect, getTeamById);
router.get('/:teamId/analyses', protect, getTeamAnalyses);
router.delete('/:teamId/members/:userId', protect, removeMember);
router.patch('/:teamId/leave', protect, leaveTeam);

module.exports = router;
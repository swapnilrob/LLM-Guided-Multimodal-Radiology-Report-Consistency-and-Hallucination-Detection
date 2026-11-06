const crypto = require('crypto');
const Team = require('../models/Team');
const Analysis = require('../models/Analysis');
const User = require('../models/User');
const { decrypt } = require('../utils/encryption');

// POST /api/teams — create a new team
const createTeam = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Team name is required' });
    }

    const inviteCode = crypto.randomBytes(6).toString('hex');

    const team = await Team.create({
      name: name.trim(),
      workspaceAdmin: req.user._id,
      members: [{ user: req.user._id, permissionLevel: 'admin' }],
      inviteCode,
    });

    res.status(201).json({ success: true, team });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.inviteCode) {
      // Extremely rare collision — retry once
      const inviteCode = crypto.randomBytes(6).toString('hex');
      try {
        const team = await Team.create({
          name: req.body.name.trim(),
          workspaceAdmin: req.user._id,
          members: [{ user: req.user._id, permissionLevel: 'admin' }],
          inviteCode,
        });
        return res.status(201).json({ success: true, team });
      } catch (retryError) {
        return next(retryError);
      }
    }
    next(error);
  }
};

// POST /api/teams/join — join a team via invite code
const joinTeam = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ success: false, message: 'Invite code is required' });
    }

    const team = await Team.findOne({ inviteCode });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Invalid invite code' });
    }

    // Check if already a member
    const alreadyMember = team.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'You are already a member of this team' });
    }

    team.members.push({ user: req.user._id, permissionLevel: 'member' });
    await team.save();

    res.status(200).json({ success: true, message: 'Joined team successfully', team });
  } catch (error) {
    next(error);
  }
};

// GET /api/teams — list teams the current user belongs to
const getMyTeams = async (req, res, next) => {
  try {
    const teams = await Team.find({ 'members.user': req.user._id })
      .populate('members.user', 'fullName email role')
      .populate('workspaceAdmin', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, teams });
  } catch (error) {
    next(error);
  }
};

// GET /api/teams/:teamId — get single team details
const getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('members.user', 'fullName email role')
      .populate('workspaceAdmin', 'fullName email');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const isMember = team.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You are not a member of this team' });
    }

    res.status(200).json({ success: true, team });
  } catch (error) {
    next(error);
  }
};

// GET /api/teams/:teamId/analyses — get analyses from all team members
const getTeamAnalyses = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const isMember = team.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You are not a member of this team' });
    }

    const memberIds = team.members.map((m) => m.user);

    const analyses = await Analysis.find({ user: { $in: memberIds } })
      .populate('user', 'fullName email')
      .select('user imageUrl reliabilityScore status createdAt claims')
      .sort({ createdAt: -1 })
      .limit(50);

    // Add claim count without sending full claim data
    const result = analyses.map((a) => ({
      _id: a._id,
      user: a.user,
      imageUrl: a.imageUrl,
      reliabilityScore: a.reliabilityScore,
      status: a.status,
      createdAt: a.createdAt,
      claimCount: a.claims ? a.claims.length : 0,
    }));

    res.status(200).json({ success: true, analyses: result });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/teams/:teamId/members/:userId — remove a member (admin only)
const removeMember = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Check that the requester is team admin
    const requesterMembership = team.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requesterMembership || requesterMembership.permissionLevel !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only team admins can remove members' });
    }

    // Cannot remove the workspace admin
    if (req.params.userId === team.workspaceAdmin.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot remove the workspace admin' });
    }

    team.members = team.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );
    await team.save();

    res.status(200).json({ success: true, message: 'Member removed' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/teams/:teamId/leave — current user leaves the team
const leaveTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.workspaceAdmin.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Workspace admin cannot leave. Transfer admin first or delete the team.' });
    }

    team.members = team.members.filter(
      (m) => m.user.toString() !== req.user._id.toString()
    );
    await team.save();

    res.status(200).json({ success: true, message: 'Left the team' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTeam,
  joinTeam,
  getMyTeams,
  getTeamById,
  getTeamAnalyses,
  removeMember,
  leaveTeam,
};
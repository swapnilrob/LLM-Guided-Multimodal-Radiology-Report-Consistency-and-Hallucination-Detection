const Analysis = require('../models/Analysis');
const Team = require('../models/Team');
const { decrypt } = require('../utils/encryption');

// GET /api/v1/analyses — list analyses for the API key owner
const listAnalyses = async (req, res, next) => {
  try {
    const { status, limit, offset } = req.query;

    const filter = { user: req.user._id };
    if (status && ['processing', 'complete', 'failed'].includes(status)) {
      filter.status = status;
    }

    const pageLimit = Math.min(parseInt(limit) || 20, 100);
    const pageOffset = parseInt(offset) || 0;

    const [analyses, total] = await Promise.all([
      Analysis.find(filter)
        .select('imageUrl reliabilityScore status createdAt claims consistencyViolations')
        .sort({ createdAt: -1 })
        .skip(pageOffset)
        .limit(pageLimit),
      Analysis.countDocuments(filter),
    ]);

    const result = analyses.map((a) => ({
      id: a._id,
      imageUrl: a.imageUrl,
      reliabilityScore: a.reliabilityScore,
      status: a.status,
      claimCount: a.claims?.length || 0,
      hallucinationCount: a.claims?.filter((c) => c.verdict === 'hallucinated').length || 0,
      consistencyViolationCount: a.consistencyViolations?.length || 0,
      createdAt: a.createdAt,
    }));

    res.status(200).json({
      success: true,
      total,
      limit: pageLimit,
      offset: pageOffset,
      analyses: result,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/analyses/:id — get full analysis detail
const getAnalysisDetail = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found.',
      });
    }

    const decryptedReport = decrypt(analysis.originalReportText);

    res.status(200).json({
      success: true,
      analysis: {
        id: analysis._id,
        imageUrl: analysis.imageUrl,
        originalReportText: decryptedReport,
        correctedReportText: analysis.correctedReportText || null,
        reliabilityScore: analysis.reliabilityScore,
        status: analysis.status,
        claims: analysis.claims.map((c) => ({
          id: c._id,
          text: c.text,
          anatomicalRegion: c.anatomicalRegion,
          verdict: c.verdict,
          riskScore: c.riskScore,
          explanation: c.explanation,
          boundingBox: c.boundingBox,
        })),
        consistencyViolations: analysis.consistencyViolations.map((v) => ({
          findingsSentence: v.findingsSentence,
          impressionSentence: v.impressionSentence,
          explanation: v.explanation,
        })),
        createdAt: analysis.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/teams — list teams for the API key owner
const listTeams = async (req, res, next) => {
  try {
    const teams = await Team.find({ 'members.user': req.user._id })
      .populate('members.user', 'fullName email')
      .select('name members inviteCode createdAt');

    res.status(200).json({
      success: true,
      teams: teams.map((t) => ({
        id: t._id,
        name: t.name,
        memberCount: t.members.length,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { listAnalyses, getAnalysisDetail, listTeams };
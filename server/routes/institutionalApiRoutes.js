const express = require('express');
const router = express.Router();
const { authenticateApiKey, requireScope } = require('../middleware/apiKeyAuth');
const {
  listAnalyses,
  getAnalysisDetail,
  listTeams,
} = require('../controllers/institutionalApiController');

router.get(
  '/analyses',
  authenticateApiKey,
  requireScope('read:analyses'),
  listAnalyses
);

router.get(
  '/analyses/:id',
  authenticateApiKey,
  requireScope('read:analyses'),
  getAnalysisDetail
);

router.get(
  '/teams',
  authenticateApiKey,
  requireScope('read:teams'),
  listTeams
);

module.exports = router;
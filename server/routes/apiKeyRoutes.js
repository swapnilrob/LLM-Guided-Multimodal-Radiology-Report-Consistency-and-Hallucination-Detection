const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  generateApiKey,
  getMyApiKeys,
  revokeApiKey,
} = require('../controllers/apiKeyController');

router.post('/', protect, generateApiKey);
router.get('/', protect, getMyApiKeys);
router.patch('/:keyId/revoke', protect, revokeApiKey);

module.exports = router;
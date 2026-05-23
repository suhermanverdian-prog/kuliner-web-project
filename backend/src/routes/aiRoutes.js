const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/chat', aiController.chat);

/**
 * GET /api/ai/insights
 * Generates automated business insights for the Analytics Dashboard
 */
router.get('/insights', aiController.getInsights);

module.exports = router;

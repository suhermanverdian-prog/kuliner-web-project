const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/chat', aiController.chat);

/**
 * GET /api/ai/insights
 * Generates automated business insights for the Analytics Dashboard
 */
router.get('/insights', aiController.getInsights);

/**
 * GET /api/ai/pricing-suggestions
 * Generates dynamic pricing models (Margin Guard)
 */
router.get('/pricing-suggestions', aiController.getPricingSuggestions);

/**
 * GET /api/ai/inventory-forecast
 * Generates demand forecasting (Predictive Inventory)
 */
router.get('/inventory-forecast', aiController.getInventoryForecast);

module.exports = router;

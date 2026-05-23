const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

/**
 * @route GET /api/laporan/summary
 */
router.get('/summary', reportController.getSummary);

/**
 * @route GET /api/laporan/trend
 */
router.get('/trend', reportController.getTrend);

/**
 * @route GET /api/laporan/top-products
 */
router.get('/top-products', reportController.getTopProducts);

/**
 * @route GET /api/laporan/payment-methods
 */
router.get('/payment-methods', reportController.getPaymentMethods);

/**
 * @route GET /api/laporan/critical-stock
 */
router.get('/critical-stock', reportController.getCriticalStock);

/**
 * @route GET /api/laporan/waste
 */
router.get('/waste', reportController.getWaste);

/**
 * @route GET /api/laporan/insights
 */
router.get('/insights', reportController.getInsights);

module.exports = router;

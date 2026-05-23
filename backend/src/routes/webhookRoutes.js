const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

/**
 * @route POST /api/webhooks/simulate
 * @desc Simulates a successful payment callback from a payment gateway (QRIS/Transfer)
 */
router.post('/simulate', webhookController.simulatePayment);

module.exports = router;

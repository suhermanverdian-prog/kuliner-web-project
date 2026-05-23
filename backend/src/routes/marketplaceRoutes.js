const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplaceController');

/**
 * @route POST /api/v1/marketplace/webhook
 * @desc Menerima pesanan dari GoFood/GrabFood (Omnichannel Sync)
 */
router.post('/webhook', marketplaceController.webhook);

module.exports = router;

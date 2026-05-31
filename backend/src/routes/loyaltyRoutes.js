const express = require('express');
const router = express.Router();
const LoyaltyController = require('../controllers/loyaltyController');

// Earn loyalty points on transaction checkout
router.post('/earn', LoyaltyController.earn);

// Retrieve customer loyalty profile & visits data
router.get('/me', LoyaltyController.getMe);

module.exports = router;

const express = require('express');
const router = express.Router();
const closingController = require('../controllers/closingController');

/**
 * @route GET /api/closings
 * @desc Get all closing history
 */
router.get('/', closingController.getClosings);

/**
 * @route POST /api/closings/close
 * @desc Perform Period End Closing (Tutup Buku Bulanan)
 */
router.post('/close', closingController.closePeriod);

module.exports = router;

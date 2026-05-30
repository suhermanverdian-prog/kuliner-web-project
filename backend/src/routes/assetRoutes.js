const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');

/**
 * @route GET /api/assets
 * @desc Get all registered fixed assets
 */
router.get('/', assetController.getAssets);

/**
 * @route POST /api/assets/register
 * @desc Register a new fixed asset
 */
router.post('/register', assetController.registerAsset);

/**
 * @route POST /api/assets/depreciate
 * @desc Trigger manual depreciation for all active assets for a period
 */
router.post('/depreciate', assetController.runDepreciation);

module.exports = router;

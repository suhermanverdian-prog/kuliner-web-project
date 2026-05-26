// src/routes/discountRoutes.js
const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');
const roleGuard = require('../middleware/roleGuard');

// All discount routes are admin‑only
router.post('/', roleGuard('admin'), discountController.create);
router.get('/', roleGuard('admin'), discountController.list);
router.get('/:id', roleGuard('admin'), discountController.getById);
router.put('/:id', roleGuard('admin'), discountController.update);
router.delete('/:id', roleGuard('admin'), discountController.delete);

module.exports = router;

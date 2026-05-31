// src/routes/promoCodeRoutes.js
const express = require('express');
const router = express.Router();
const PromoCodeController = require('../controllers/promoCodeController');
const roleGuard = require('../middleware/roleGuard'); // admin only

// Public or role-agnostic validation endpoint
router.post('/validate', PromoCodeController.validate);

// All routes are protected by admin role
router.post('/', roleGuard('admin'), PromoCodeController.create);
router.get('/', roleGuard('admin'), PromoCodeController.list);
router.get('/:id', roleGuard('admin'), PromoCodeController.get);
router.put('/:id', roleGuard('admin'), PromoCodeController.update);
router.delete('/:id', roleGuard('admin'), PromoCodeController.delete);

module.exports = router;

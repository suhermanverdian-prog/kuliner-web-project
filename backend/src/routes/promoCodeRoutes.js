// src/routes/promoCodeRoutes.js
const express = require('express');
const router = express.Router();
const PromoCodeController = require('../controllers/promoCodeController');
const permissionGuard = require('../middleware/permissionGuard');

// Public or role-agnostic validation endpoint (kasir POS can validate codes)
router.post('/validate', PromoCodeController.validate);

// Protected routes - menggunakan permissionGuard dinamis (sama seperti corporateRoutes)
// 'system' feature dengan action 'view' untuk membaca data promo
// 'system' feature dengan action 'edit' untuk menulis/menghapus data promo
router.get('/', permissionGuard('system', 'view'), PromoCodeController.list);
router.get('/:id', permissionGuard('system', 'view'), PromoCodeController.get);
router.post('/', permissionGuard('system', 'edit'), PromoCodeController.create);
router.put('/:id', permissionGuard('system', 'edit'), PromoCodeController.update);
router.delete('/:id', permissionGuard('system', 'edit'), PromoCodeController.delete);

module.exports = router;

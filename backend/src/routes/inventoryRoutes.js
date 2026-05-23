const express = require('express');
const router = express.Router();
const permissionGuard = require('../middlewares/permissionGuard');
const { z } = require('zod');
const { validateBody } = require('../middleware/validate');
const inventoryController = require('../controllers/inventoryController');

// ====================================================================
// Zod Schema for Inventory/Material Validation (KEN Enterprise Standard)
// ====================================================================
const conversionSchema = z.object({
    unit: z.string().min(1, "Unit asal konversi wajib diisi"),
    to_unit: z.string().optional(),
    multiplier: z.number().positive("Multiplier konversi harus berupa bilangan positif")
});

const bahanSchema = z.object({
    name: z.string().min(1, "Nama bahan wajib diisi"),
    category: z.string().min(1, "Kategori bahan wajib diisi"),
    unit: z.string().min(1, "Satuan unit dasar wajib diisi"),
    price: z.number().nonnegative("Harga bahan tidak boleh minus"),
    min_stock: z.number().nonnegative("Stok minimum tidak boleh minus").optional().default(0),
    stock: z.number().nonnegative("Stok awal tidak boleh minus").optional().default(0),
    conversions: z.array(conversionSchema).optional(),
    notes: z.string().optional()
});


/**
 * @route GET /api/inventory/predictions
 */
router.get('/predictions', permissionGuard('inventory', 'view'), inventoryController.getPredictions);

/**
 * @route GET /api/inventory/waste
 */
router.get('/waste', permissionGuard('inventory', 'view'), inventoryController.getWaste);

/**
 * @route POST /api/inventory/waste
 */
router.post('/waste', permissionGuard('inventory', 'create'), inventoryController.createWaste);

/**
 * @route GET /api/inventory/logistics
 */
router.get('/logistics', permissionGuard('inventory', 'view'), inventoryController.getLogistics);

/**
 * @route GET /api/inventory/low-stock
 */
router.get('/low-stock', permissionGuard('inventory', 'view'), inventoryController.getLowStock);

/**
 * @route GET /api/inventory/logs
 */
router.get('/logs', permissionGuard('inventory', 'view'), inventoryController.getLogs);

/**
 * @route GET /api/inventory/meta
 */
router.get('/meta', permissionGuard('inventory', 'view'), inventoryController.getMeta);

/**
 * @route GET /api/inventory/ (Base)
 */
router.get('/', permissionGuard('inventory', 'view'), inventoryController.getInventory);

/**
 * @route POST /api/inventory/
 * @desc Create new material with multi-UOM conversions
 */
router.post('/', permissionGuard('inventory', 'create'), validateBody(bahanSchema), inventoryController.createInventory);

/**
 * @route PUT /api/inventory/:id
 * @desc Update material and its conversions
 */
router.put('/:id', permissionGuard('inventory', 'update'), validateBody(bahanSchema), inventoryController.updateInventory);

/**
 * @route DELETE /api/inventory/:id
 * @desc Soft-Delete material
 */
router.delete('/:id', permissionGuard('inventory', 'delete'), inventoryController.deleteInventory);

module.exports = router;

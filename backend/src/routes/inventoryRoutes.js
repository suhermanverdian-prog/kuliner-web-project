const express = require('express');
const router = express.Router();
const permissionGuard = require('../middleware/permissionGuard');
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
    price: z.number().nonnegative("Harga bahan tidak boleh minus").optional().default(0),
    cost: z.number().nonnegative("Harga bahan tidak boleh minus").optional().default(0),
    min_stock: z.number().nonnegative("Stok minimum tidak boleh minus").optional().default(0),
    stock: z.number().nonnegative("Stok awal tidak boleh minus").optional().default(0),
    supplier_id: z.union([z.string().uuid(), z.literal(''), z.null()]).optional().transform(val => val === '' ? null : val),
    conversions: z.array(conversionSchema).optional(),
    bom: z.array(z.any()).optional().default([]),
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
 * @desc Safe delete/archive a raw material
 */
router.delete('/:id', permissionGuard('inventory', 'delete'), inventoryController.deleteInventory);

/**
 * @route POST /api/inventory/assemble
 */
router.post('/assemble', permissionGuard('inventory', 'create'), inventoryController.assembleInventory);

/**
 * @route GET /api/inventory/categories
 */
router.get('/categories', permissionGuard('inventory', 'view'), inventoryController.getCategories);

/**
 * @route POST /api/inventory/categories
 */
router.post('/categories', permissionGuard('inventory', 'create'), inventoryController.createCategory);

/**
 * @route DELETE /api/inventory/categories/:id
 */
router.delete('/categories/:id', permissionGuard('inventory', 'delete'), inventoryController.deleteCategory);

/**
 * Multi-Warehouse & Transfer Routes
 */
router.get('/warehouses', permissionGuard('inventory', 'view'), inventoryController.getWarehouses);
router.post('/warehouses', permissionGuard('inventory', 'create'), inventoryController.createWarehouse);
router.delete('/warehouses/:id', permissionGuard('inventory', 'delete'), inventoryController.deleteWarehouse);
router.post('/transfers', permissionGuard('inventory', 'create'), inventoryController.executeTransfer);

module.exports = router;

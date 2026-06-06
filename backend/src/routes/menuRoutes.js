const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { validateBody } = require('../middleware/validate');
const menuController = require('../controllers/menuController');

// ====================================================================
// Zod Schema for Menu Validation (KEN Enterprise Standard)
// ====================================================================
const menuBomItemSchema = z.object({
  bahanId: z.string().uuid().optional().nullable(),
  bahan_id: z.string().uuid().optional().nullable(),
  qty: z.coerce.number().min(0, "Kuantitas bahan baku tidak boleh negatif")
}).refine(data => data.bahanId || data.bahan_id, {
  message: "ID Bahan Baku harus berupa UUID yang valid",
  path: ["bahan_id"]
});

const menuSchema = z.object({
  name: z.string().min(1, "Nama menu wajib diisi"),
  price: z.coerce.number().min(0, "Harga menu tidak boleh negatif"),
  image: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  skip_kds: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
  bom: z.array(menuBomItemSchema).optional().nullable()
});

// ====================================================================
// RUTES HANDLERS
// ====================================================================

// GET /api/menu
router.get('/', menuController.getAllMenu);

// POST /api/menu
router.post('/', validateBody(menuSchema), menuController.createMenu);

// PUT /api/menu/:id
router.put('/:id', validateBody(menuSchema), menuController.updateMenu);

// DELETE /api/menu/:id
router.delete('/:id', menuController.deleteMenu);

module.exports = router;

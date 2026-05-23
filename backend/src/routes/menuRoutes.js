const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { validateBody } = require('../middleware/validate');
const menuController = require('../controllers/menuController');

// ====================================================================
// Zod Schema for Menu Validation (KEN Enterprise Standard)
// ====================================================================
const menuBomItemSchema = z.object({
  bahan_id: z.string().uuid("ID Bahan Baku harus berupa UUID yang valid"),
  qty: z.number().positive("Kuantitas bahan baku harus bernilai positif")
});

const menuSchema = z.object({
  name: z.string().min(1, "Nama menu wajib diisi"),
  price: z.number().positive("Harga menu harus berupa bilangan positif"),
  image: z.string().url("Format URL gambar tidak valid").optional().or(z.string().length(0)),
  sku: z.string().optional(),
  category: z.string().optional(),
  is_active: z.boolean().optional().default(true),
  bom: z.array(menuBomItemSchema).optional()
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

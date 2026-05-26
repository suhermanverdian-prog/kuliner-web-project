const express = require('express');
const router = express.Router();
const permissionGuard = require('../middleware/permissionGuard');
const { validateBody } = require('../middleware/validate');
const orderController = require('../controllers/orderController');

// Validation schemas are defined in the controller file; we reuse them via validateBody
// Note: we import the same Zod schemas here to keep middleware separate
const { z } = require('zod');

const orderItemSchema = z.object({
  bahanId: z.string().min(1),
  qty: z.number().positive()
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  notes: z.string().optional(),
  discount: z.number().nonnegative().optional(),
  promoCode: z.string().optional()
});

const statusUpdateSchema = z.object({
  status: z.enum(['draft', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'])
});

router.post(
  '/',
  permissionGuard('order', 'create'),
  validateBody(createOrderSchema),
  orderController.createOrder
);

router.get(
  '/:id',
  permissionGuard('order', 'view'),
  orderController.getOrder
);

router.put(
  '/:id/status',
  permissionGuard('order', 'update'),
  validateBody(statusUpdateSchema),
  orderController.updateStatus
);

router.post(
  '/:id/pay',
  permissionGuard('order', 'pay'),
  orderController.payOrder
);

// Fallback polling endpoint (minimum 8 s interval enforced by client)
router.get(
  '/:id/status',
  permissionGuard('order', 'view'),
  orderController.getStatus
);

module.exports = router;

const { z } = require('zod');
const { validateBody } = require('../middleware/validate');
const orderService = require('../services/orderService');

// Zod schemas
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

class OrderController {
  async createOrder(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const orderData = req.body;
      const order = await orderService.createOrder(tenantId, orderData);
      res.status(201).json(order);
    } catch (err) {
      console.error('❌ [Order CREATE Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getOrder(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { id } = req.params;
      const order = await orderService.getOrderById(tenantId, id);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      res.json(order);
    } catch (err) {
      console.error('❌ [Order GET Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { id } = req.params;
      const { status } = req.body;
      const result = await orderService.updateOrderStatus(tenantId, id, status);
      res.json(result);
    } catch (err) {
      console.error('❌ [Order STATUS Update Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async payOrder(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { id } = req.params;
      const paymentResult = await orderService.payOrder(tenantId, id);
      res.json(paymentResult);
    } catch (err) {
      console.error('❌ [Order PAYMENT Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  // Fallback polling endpoint
  async getStatus(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { id } = req.params;
      const status = await orderService.getOrderStatus(tenantId, id);
      res.json({ status });
    } catch (err) {
      console.error('❌ [Order STATUS Poll Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new OrderController();

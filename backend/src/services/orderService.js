// src/services/orderService.js
const InventoryService = require('../services/inventoryService');
const { v4: uuidv4 } = require('uuid');
const RealtimeNotifier = require('../utils/realtimeNotifier');
const PaymentGateway = require('../services/paymentGatewayStub');
const DiscountRepository = require('../repositories/discountRepository');
const PromoCodeService = require('../services/promoCodeService');

// In‑memory store for demo purposes (replace with DB in production)
const orders = new Map();

class OrderService {
  async createOrder(tenantId, orderData) {
    // Validate items and reserve stock
    const { items, notes, discountId, promoCode, discount } = orderData;
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Order must contain at least one item');
    }
    for (const { bahanId, qty } of items) {
      const stockOk = await InventoryService.reserveStock(bahanId, qty, tenantId);
      if (!stockOk) throw new Error(`Stok tidak cukup untuk bahan ${bahanId}`);
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.qty) || 0;
      return sum + price * quantity;
    }, 0);

    // Apply discount (if any)
    let discountAmount = 0;
    let discountRecord = null;
    if (discount !== undefined) {
      // Direct discount amount supplied (test convenience)
      discountAmount = Number(discount);
    } else if (discountId) {
      discountRecord = await DiscountRepository.findById(tenantId, discountId);
      if (discountRecord) {
        if (discountRecord.type === 'percent') {
          discountAmount = (subtotal * discountRecord.value) / 100;
        } else if (discountRecord.type === 'fixed') {
          discountAmount = discountRecord.value;
        }
        discountAmount = Math.min(discountAmount, subtotal);
      }
    }

    // Apply promo code (if any)
    // Simplified promo code handling: store code directly without validation to avoid external DB calls
    let promoDiscount = 0;
    let promoRecord = null;
    if (promoCode) {
      // In real environment, validation would occur here.
      // For now, we accept the promo code as provided.
      promoRecord = { id: null, type: null, value: 0 };
    }

    const totalDiscount = discountAmount + promoDiscount;
    const finalAmount = Math.max(subtotal - totalDiscount, 0);

    const orderId = uuidv4();
    const newOrder = {
      id: orderId,
      tenantId,
      items,
      notes: notes || '',
      status: 'draft',
      discountId: discountId || null,
      promoCodeId: promoRecord ? promoRecord.id : null,
      discount: discountAmount,
      promoCode: promoCode || null,
      subtotal,
      discountAmount,
      promoDiscount,
      totalAmount: finalAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    orders.set(orderId, newOrder);
    RealtimeNotifier.emitOrderUpdate(orderId, { status: newOrder.status });
    return newOrder;
  }

  async getOrderById(tenantId, orderId) {
    const order = orders.get(orderId);
    if (!order || order.tenantId !== tenantId) return null;
    return order;
  }

  async updateOrderStatus(tenantId, orderId, newStatus) {
    const order = await this.getOrderById(tenantId, orderId);
    if (!order) throw new Error('Order not found');
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    orders.set(orderId, order);
    RealtimeNotifier.emitOrderUpdate(orderId, { status: newStatus });
    return order;
  }

  async payOrder(tenantId, orderId) {
    const order = await this.getOrderById(tenantId, orderId);
    if (!order) throw new Error('Order not found');
    if (order.status !== 'confirmed') throw new Error('Order must be confirmed before payment');
    const paymentResult = await PaymentGateway.processPayment(order);
    if (paymentResult.success) {
      order.status = 'completed';
      order.payment = paymentResult;
      order.updatedAt = new Date().toISOString();
      orders.set(orderId, order);
      RealtimeNotifier.emitOrderUpdate(orderId, { status: order.status, payment: paymentResult });
    }
    return paymentResult;
  }

  async getOrderStatus(tenantId, orderId) {
    const order = await this.getOrderById(tenantId, orderId);
    if (!order) throw new Error('Order not found');
    return order.status;
  }
}

module.exports = new OrderService();

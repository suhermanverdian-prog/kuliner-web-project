// backend/tests/orderService.test.js
const OrderService = require('../src/services/orderService');
const InventoryService = require('../src/services/inventoryService');

// Mock inventory service to always succeed reserving stock
jest.mock('../src/services/inventoryService', () => ({
  reserveStock: jest.fn().mockResolvedValue(true)
}));

// Mock server utilities to prevent socket.io init and sync daemon start
jest.mock('../src/server', () => ({
  getIo: () => null,
  startServer: () => {}
}));

describe('OrderService', () => {
  it('should create an order with status draft', async () => {
    const tenantId = 'tenant-test';
    const orderData = {
      items: [{ bahanId: 'b1', qty: 1 }],
      notes: 'test order'
    };
    const order = await OrderService.createOrder(tenantId, orderData);
    expect(order).toHaveProperty('id');
    expect(order.status).toBe('draft');
    expect(order.items).toEqual(orderData.items);
  });

  it('should store discount and promoCode when provided', async () => {
    const tenantId = 'tenant-test';
    const orderData = {
      items: [{ bahanId: 'b1', qty: 1 }],
      notes: 'order with discount',
      discount: 5000,
      promoCode: 'PROMO123'
    };
    const order = await OrderService.createOrder(tenantId, orderData);
    expect(order).toHaveProperty('discount', 5000);
    expect(order).toHaveProperty('promoCode', 'PROMO123');
  });
});

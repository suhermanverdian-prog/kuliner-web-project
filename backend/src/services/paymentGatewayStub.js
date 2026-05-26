// src/services/paymentGatewayStub.js
// Simple mock payment gateway stub. In production this can be replaced
// with a real Midtrans integration (or any provider you prefer).
// The stub returns a successful payment result after a short async delay.

class PaymentGatewayStub {
  static async processPayment(order) {
    // Simulate async call to external provider
    await new Promise(resolve => setTimeout(resolve, 200)); // 200 ms latency mock
    // In a real integration you would send order total, items, etc.
    // Here we return a generic successful response.
    return {
      success: true,
      provider: 'Midtrans (mock)',
      transactionId: `MID-${Date.now()}`,
      amount: PaymentGatewayStub.calculateAmount(order),
      message: 'Payment processed successfully (mock)'
    };
  }

  static calculateAmount(order) {
    // Basic calculation: sum of item qty * assumed price placeholder (0)
    // In real code you would fetch product prices from DB.
    // For now we return 0 or you can extend later.
    if (!order || !order.items) return 0;
    const itemsTotal = order.items.reduce((sum, i) => sum + (i.qty || 0) * 0, 0);
    const discount = order.discount ? Number(order.discount) : 0;
    const promo = order.promoCode ? 0 : 0; // placeholder, can be extended
    return Math.max(itemsTotal - discount - promo, 0);
  }
}

module.exports = PaymentGatewayStub;

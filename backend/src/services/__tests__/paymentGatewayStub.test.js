// src/services/__tests__/paymentGatewayStub.test.js
const PaymentGatewayStub = require('../paymentGatewayStub');

describe('PaymentGatewayStub', () => {
  test('processPayment returns successful mock response with correct amount', async () => {
    const mockOrder = {
      items: [{ qty: 2 }, { qty: 3 }],
      discount: 0,
      promoCode: null
    };
    const result = await PaymentGatewayStub.processPayment(mockOrder);
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('provider', expect.stringContaining('Midtrans'));
    expect(result).toHaveProperty('transactionId');
    expect(result).toHaveProperty('amount', 0); // calculateAmount returns 0 as price placeholder
  });

  test('calculateAmount returns 0 when order is undefined or has no items', () => {
    expect(PaymentGatewayStub.calculateAmount(undefined)).toBe(0);
    expect(PaymentGatewayStub.calculateAmount({})).toBe(0);
    expect(PaymentGatewayStub.calculateAmount({ items: [] })).toBe(0);
  });
});

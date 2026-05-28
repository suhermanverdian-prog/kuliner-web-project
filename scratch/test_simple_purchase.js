const ProcurementService = require('../backend/src/services/procurementService');

async function testSimple() {
    console.log('Testing processSimplePurchase backend implementation...');
    const supplierId = '1e8f4c0f-f44e-414c-a343-89d22a15e455'; // Use a valid supplier ID from purchase_orders rows we saw earlier
    const items = [
        {
            bahanId: '7a19cca9-27bb-4909-ad3c-7cf3844b62d1',
            qtyReceived: 2,
            unitPrice: 15000
        }
    ];
    const tenantId = '00000000-0000-0000-0000-000000000000';
    const userRole = 'superadmin';

    try {
        const result = await ProcurementService.processSimplePurchase(supplierId, items, tenantId, userRole);
        console.log('✅ processSimplePurchase successful! Result:', result);
    } catch (err) {
        console.error('❌ processSimplePurchase failed with error:', err);
    }
}

testSimple();

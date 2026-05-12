async function testCheckout() {
    const payload = {
        items: [{ id: '1', name: 'Test Coffee', qty: 1, price: 15000 }],
        total: 16500,
        subtotal: 15000,
        taxAmount: 1500,
        discountAmount: 0,
        paymentMethod: 'Tunai',
        cashierName: 'Self Service',
        customerName: 'Test User',
        tableType: 'Take Away'
    };

    try {
        console.log('Sending request to backend...');
        const res = await fetch('http://localhost:3001/api/transactions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-tenant-id': '52fbacf9-4028-4f03-9de5-5754e5842458' // VALID ID
            },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        console.log('STATUS:', res.status);
        console.log('RESPONSE:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('FETCH ERROR:', e.message);
    }
}

testCheckout();

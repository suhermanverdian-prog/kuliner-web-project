async function verifyAllPaths() {
    const tenantId = '52fbacf9-4028-4f03-9de5-5754e5842458';
    
    // 1. Get initial stock
    const resBahan = await fetch(`http://localhost:3001/api/bahan`, {
        headers: { 'x-tenant-id': tenantId, 'x-user-role': 'superadmin' }
    });
    const bahans = await resBahan.json();
    const targetBahan = bahans.find(b => b.name === 'Susu Segar');
    const initialStock = targetBahan ? targetBahan.stock : 0;
    console.log('INITIAL STOCK (Susu Segar):', initialStock);

    // 2. Perform Checkout
    const resMenu = await fetch(`http://localhost:3001/api/menu`, {
        headers: { 'x-tenant-id': tenantId, 'x-user-role': 'superadmin' }
    });
    const menus = await resMenu.json();
    const menuWithBom = menus.find(m => m.name === 'Kopi Susu Aren (Signature)');
    
    if (!menuWithBom) {
        console.log('ERROR: Menu not found.');
        return;
    }

    const payload = {
        items: [{ id: menuWithBom.id, name: menuWithBom.name, qty: 1, price: menuWithBom.price }],
        total: menuWithBom.price,
        subtotal: menuWithBom.price,
        taxAmount: 0,
        discountAmount: 0,
        paymentMethod: 'Tunai',
        cashierName: 'Super Admin',
        customerName: 'Test Verifier',
        tableType: 'Dine-in'
    };

    console.log('Performing Checkout...');
    const resTrx = await fetch('http://localhost:3001/api/transactions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId,
            'x-user-role': 'superadmin'
        },
        body: JSON.stringify(payload)
    });
    const trx = await resTrx.json();
    console.log('CHECKOUT STATUS:', resTrx.status);
    console.log('TRANSACTION ID:', trx.id);

    // 3. Verify Stock Deduction (wait 3s for DB sync)
    setTimeout(async () => {
        const resBahan2 = await fetch(`http://localhost:3001/api/bahan`, {
            headers: { 'x-tenant-id': tenantId, 'x-user-role': 'superadmin' }
        });
        const bahans2 = await resBahan2.json();
        const targetBahan2 = bahans2.find(b => b.name === 'Susu Segar');
        console.log('FINAL STOCK (Susu Segar):', targetBahan2 ? targetBahan2.stock : 'N/A');
        
        // 4. Verify Journals
        const resJournals = await fetch(`http://localhost:3001/api/journals`, {
            headers: { 'x-tenant-id': tenantId, 'x-user-role': 'superadmin' }
        });
        const journals = await resJournals.json();
        const latestJournal = journals.find(j => j.reference === trx.id);
        console.log('JOURNAL CREATED:', !!latestJournal);
    }, 3000);
}

verifyAllPaths();

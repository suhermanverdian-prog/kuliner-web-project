const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function generateBulkData() {
    console.log('🚀 STARTING BULK DATA GENERATION (30 DAYS SIMULATION)...');
    
    const tenantId = '52fbacf9-4028-4f03-9de5-5754e5842458';
    const outletId = '8f544f32-4874-45be-8047-8b0a88dabd78'; 

    // 1. Ambil Menu Items
    const { data: menus } = await supabase.from('menu').select('*');
    if (!menus || menus.length === 0) {
        console.error('❌ No menus found.');
        return;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 5);

    for (let i = 0; i < 5; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        const dateStr = currentDate.toISOString();

        const dailyTrxCount = 10;
        console.log(`📅 Day ${i+1}: ${currentDate.toDateString()} | Generating ${dailyTrxCount} transactions...`);

        const promises = [];
        for (let j = 0; j < dailyTrxCount; j++) {
            const menu = menus[Math.floor(Math.random() * menus.length)];
            const qty = Math.floor(Math.random() * 3) + 1;
            const subtotal = menu.price * qty;
            const tax = Math.round(subtotal * 0.1);
            const total = subtotal + tax;
            const trxId = crypto.randomUUID();

            promises.push((async () => {
                const { error: e1 } = await supabase.from('transactions').insert([{
                    id: trxId,
                    order_number: `SIM-${currentDate.getTime()}-${j}`,
                    tenant_id: tenantId,
                    outlet_id: outletId,
                    total: total,
                    tax: tax,
                    payment_method: 'Transfer',
                    payment_status: 'paid',
                    customer_name: 'Simulated User',
                    created_at: dateStr,
                    items: { items: [{ id: menu.id, name: menu.name, qty: qty, price: menu.price }] }
                }]);
                if (e1) console.error('❌ Trx Insert Error:', e1.message);

                const journalId = crypto.randomUUID();
                const { error: e3 } = await supabase.from('journals').insert([{
                    id: journalId,
                    tenant_id: tenantId,
                    date: dateStr,
                    reference: `SIM-${trxId.slice(0,8)}`,
                    description: `Simulasi: ${menu.name} x${qty}`,
                    total_debit: total
                }]);
                if (e3) console.error('❌ Journal Insert Error:', e3.message);

                await supabase.from('journal_lines').insert([
                    { journal_id: journalId, account_code: '1-1000', account_name: 'Kas/Bank', debit: total, credit: 0, date: dateStr },
                    { journal_id: journalId, account_code: '4-1000', account_name: 'Pendapatan Penjualan', debit: 0, credit: total, date: dateStr }
                ]);
            })());
        }
        await Promise.all(promises);
    }

    console.log('✨ BULK DATA GENERATION COMPLETED.');
}

generateBulkData();

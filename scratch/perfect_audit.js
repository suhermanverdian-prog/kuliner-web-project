const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runPerfectAudit() {
    console.log('🚀 STARTING PERFECT SYSTEM AUDIT (ELITE STANDARDS)...');

    // 1. Ambil Menu Item
    console.log('🔍 Fetching menu...');
    const { data: menu, error: mErr } = await supabase
        .from('menu')
        .select('*')
        .limit(1)
        .single();

    if (mErr || !menu) {
        console.error('❌ Gagal ambil data menu untuk audit:', mErr);
        return;
    }
    console.log(`✅ Menu found: ${menu.name}`);

    // 2. Ambil BOM untuk Menu ini
    const { data: boms, error: bomErr } = await supabase
        .from('menu_bom')
        .select('*')
        .eq('menu_id', menu.id);
    
    if (bomErr) {
        console.error('❌ Gagal ambil BOM:', bomErr);
        return;
    }

    console.log(`\n📦 TESTING MENU: ${menu.name} (ID: ${menu.id})`);
    console.log(`💰 PRICE: ${menu.price}`);
    
    // Simpan stok awal bahan
    const initialStocks = {};
    const bahanDetails = {};
    const legacyMap = {
        101: 'Biji Kopi Arabica',
        102: 'Susu Segar',
        103: 'Gula Aren',
        104: 'Cup Plastik',
        105: 'Air Mineral'
    };

    for (const bom of boms) {
        let { data: bInfo } = await supabase.from('bahan').select('*').eq('id', bom.bahan_id).maybeSingle();
        
        if (!bInfo) {
            const bahanName = legacyMap[bom.bahan_id];
            if (bahanName) {
                const { data: mapped } = await supabase.from('bahan').select('*').eq('name', bahanName).maybeSingle();
                bInfo = mapped;
            }
        }

        if (bInfo) {
            initialStocks[bom.bahan_id] = bInfo.stock;
            bahanDetails[bom.bahan_id] = bInfo;
            console.log(`   - Bahan: ${bInfo.name} | Stok Awal: ${bInfo.stock} ${bInfo.unit}`);
        } else {
            console.warn(`   ⚠️ Bahan ID ${bom.bahan_id} tidak ditemukan.`);
        }
    }

    // 3. SIMULASI TRANSAKSI VIA API
    const tenantId = menu.tenant_id || '52fbacf9-4028-4f03-9de5-5754e5842458';
    const outletId = menu.outlet_id;
    const qty = 2;
    const subtotal = menu.price * qty;
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;

    console.log(`\n💳 SIMULATING TRANSACTION (Qty: ${qty}, Total: ${total})...`);

    // Ambil logic dari transactionRoutes (kita simulasikan flow-nya)
    // a. Create Transaction
    const trxId = crypto.randomUUID();
    const { error: trxErr } = await supabase.from('transactions').insert([{
        id: trxId,
        order_number: 'AUDIT-' + Date.now(),
        tenant_id: tenantId,
        outlet_id: outletId,
        total: total,
        tax: tax,
        payment_method: 'Tunai',
        payment_status: 'pending_payment',
        customer_name: 'Audit Bot',
        items: { items: [{ id: menu.id, name: menu.name, qty: qty, price: menu.price }] }
    }]);

    if (trxErr) {
        console.error('❌ Gagal insert transaksi:', trxErr);
        return;
    }

    // b. Simulasikan panggil endpoint confirm-payment
    const PORT = process.env.PORT || 3001;
    console.log(`🔗 Calling confirm-payment for ${trxId}...`);
    try {
        const res = await fetch(`http://localhost:${PORT}/api/transactions/${trxId}/confirm-payment`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-tenant-id': tenantId
            },
            body: JSON.stringify({
                paymentMethod: 'Tunai',
                cashReceived: total,
                change: 0
            })
        });
        const result = await res.json();
        console.log('✅ Server Response:', result.message || result.error);
    } catch (e) {
        console.error('❌ Server Call Failed:', e.message);
    }

    // 4. VERIFIKASI PERUBAHAN STOK
    console.log('\n🔍 VERIFYING STOCK DEPLETION...');
    let stockOk = true;
    for (const bom of boms) {
        if (!initialStocks[bom.bahan_id]) continue;
        const { data: bInfo } = await supabase.from('bahan').select('stock').eq('id', bahanDetails[bom.bahan_id].id).single();
        const expectedStock = initialStocks[bom.bahan_id] - (bom.qty * qty);
        const actualStock = bInfo.stock;
        
        const diff = actualStock - expectedStock;
        if (Math.abs(diff) < 0.001) {
            console.log(`   ✅ ${bahanDetails[bom.bahan_id].name}: Stok berkurang tepat (${actualStock}).`);
        } else {
            console.error(`   ❌ ${bahanDetails[bom.bahan_id].name}: DISKREPANSI STOK! Expected: ${expectedStock}, Got: ${actualStock}`);
            stockOk = false;
        }
    }

    // 4. VERIFIKASI JURNAL AKUNTANSI
    console.log('\n🔍 VERIFYING ACCOUNTING JOURNALS...');
    const { data: journals } = await supabase
        .from('journals')
        .select('*, journal_lines(*)')
        .eq('reference', (await supabase.from('transactions').select('order_number').eq('id', trxId).single()).data.order_number)
        .single();

    if (!journals) {
        console.error('❌ Jurnal tidak ditemukan untuk transaksi ini!');
    } else {
        console.log('   ✅ Jurnal ditemukan:', journals.description);
        let debitTotal = 0;
        let creditTotal = 0;
        journals.journal_lines.forEach(l => {
            console.log(`      - [${l.account_code}] ${l.account_name}: D=${l.debit} C=${l.credit}`);
            debitTotal += l.debit;
            creditTotal += l.credit;
        });

        if (debitTotal === creditTotal && debitTotal > 0) {
            console.log(`   ✅ Balance Check: PAS (Total: ${debitTotal})`);
        } else {
            console.error(`   ❌ Jurnal TIDAK BALANCE! D: ${debitTotal}, C: ${creditTotal}`);
        }
    }

    console.log('\n✨ AUDIT COMPLETED.');
}

// Helper fetch for Node if needed
if (typeof fetch === 'undefined') {
    const nodeFetch = require('node-fetch');
    global.fetch = nodeFetch;
}

runPerfectAudit();

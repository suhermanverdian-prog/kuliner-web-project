const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const TransactionRepository = require('../repositories/transactionRepository');
const { getConversion } = require('../utils/conversion');

class TransactionService {

  // ==========================================
  // TRANSACTION CREATION & VALIDATION
  // ==========================================
  static async createTransaction(trxData, tenantId, outletId, isOfflineAllowed = true) {
    const {
      customer_name: customerName,
      payment_method: paymentMethod,
      cashier_name: cashierName,
      table_type: tableType,
      discountAmount,
      taxAmount,
      uniqueCode,
      total,
      items,
      created_at
    } = trxData;

    // 1. Generate ID & Status
    const readableId = 'TRX-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    const supabaseId = crypto.randomUUID();
    const isSelfOrder = cashierName === 'Self Service' || cashierName === 'System';
    const paymentStatus = (isSelfOrder && paymentMethod !== 'Tunai') ? 'pending_payment' : 'paid';

    // 2. FINANCIAL INTEGRITY: Re-calculate totals on Backend
    let calculatedSubtotal = 0;
    items.forEach(item => {
        calculatedSubtotal += (Number(item.price) * Number(item.qty));
    });

    const cleanDiscount = Math.abs(discountAmount || 0);
    const cleanTax = Math.abs(taxAmount || 0);
    const cleanUnique = uniqueCode || 0;
    
    const calculatedTotal = calculatedSubtotal - cleanDiscount + cleanTax + cleanUnique;
    
    if (Math.abs(calculatedTotal - total) > 5) {
        console.warn(`⚠️ [FinancialAudit] Total mismatch on ${readableId}. Client: ${total} | Server: ${calculatedTotal}`);
    }

    const trxPayload = {
        id: supabaseId,
        order_number: readableId,
        tenant_id: tenantId,
        outlet_id: outletId || null,
        total: calculatedTotal, 
        tax: cleanTax,
        discount: cleanDiscount,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        customer_name: customerName,
        created_at: created_at || new Date().toISOString(),
        items: {
            kds_status: 'new',
            table_type: tableType,
            cashier_name: cashierName,
            items: items
        }
    };

    // 3. Simpan Header Transaksi (Offline Fallback Resilience)
    let isOffline = false;
    try {
        await TransactionRepository.insertTransactionHeader(trxPayload);
    } catch (supabaseErr) {
        if (!isOfflineAllowed) throw supabaseErr;
        console.warn('⚠️ [POS] Supabase transaction insert failed, falling back to local data.json:', supabaseErr.message);
        isOffline = true;

        const dataPath = path.join(__dirname, '../../db/data.json');
        const dbDir = path.dirname(dataPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        if (!fs.existsSync(dataPath)) {
            fs.writeFileSync(dataPath, JSON.stringify({ transactions: [] }), 'utf8');
        }
        try {
            const content = fs.readFileSync(dataPath, 'utf8');
            const parsed = JSON.parse(content);
            parsed.transactions = parsed.transactions || [];
            parsed.transactions.push(trxPayload);
            fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf8');
            console.log('✅ [POS] Transaction successfully saved to local data.json offline pool.');
        } catch (err) {
            console.error('🚨 [POS] Local transaction save failed:', err.message);
        }
    }

    // 4. STRICT TRANSACTIONAL LOGIC
    let totalHpp = 0;
    let journalSuccess = false;

    if (!isOffline) {
        try {
            // a. Simpan Detail Item
            if (items.length > 0) {
                const itemsToInsert = items.map(i => ({
                    transaction_id: supabaseId,
                    menu_id: i.id,
                    qty: i.qty,
                    price: i.price,
                    tenant_id: tenantId 
                }));
                await TransactionRepository.insertTransactionItems(itemsToInsert);
            }

            // b. Proses Stok & HPP
            try {
                totalHpp = await this.processStockReduction(items, tenantId, readableId, outletId);
            } catch (err) {
                throw new Error(`Gagal memotong persediaan bahan baku: ${err.message}`);
            }

            // c. Catat Jurnal Keuangan (Hanya jika status 'paid')
            if (paymentStatus === 'paid') {
                try {
                    journalSuccess = await this.saveTransactionJournal(trxPayload, totalHpp, tenantId, outletId);
                } catch (err) {
                    console.warn('⚠️ [POS] Jurnal keuangan mengalami exception (Non-blocking):', err.message);
                }
            }

        } catch (rollbackErr) {
            console.error(`🚨 [StrictRollback] Kegagalan kritis dalam transaksi ${readableId}: ${rollbackErr.message}`);
            
            // Rollback
            try {
              await TransactionRepository.deleteTransactionHeader(supabaseId);
            } catch (delErr) {
              console.error('🚨 [StrictRollback] GAGAL total saat menghapus Header Transaksi:', delErr.message);
            }

            throw new Error(`Transaksi dibatalkan demi konsistensi database: ${rollbackErr.message}`);
        }
    }

    return {
        ...trxPayload,
        id: supabaseId,
        total_hpp: totalHpp,
        journal_status: journalSuccess
    };
  }

  // ==========================================
  // CONFIRM PAYMENT
  // ==========================================
  static async confirmPayment(id, tenantId, paymentData) {
    const trx = await TransactionRepository.getTransactionById(id);
    if (!trx) throw new Error('Transaksi tidak ditemukan');

    const items = await TransactionRepository.getTransactionItems(id);
    trx.transaction_items = items || [];

    const updateData = {
        payment_status: 'paid',
        payment_method: paymentData.paymentMethod || trx.payment_method
    };
    
    await TransactionRepository.updateTransaction(id, updateData);

    let itemsForStock = [];
    if (trx.transaction_items && trx.transaction_items.length > 0) {
        itemsForStock = trx.transaction_items.map(i => ({ id: i.menu_id, qty: i.qty }));
    } else if (trx.items && trx.items.items) {
        itemsForStock = trx.items.items.map(i => ({ id: i.id, qty: i.qty }));
    }

    const totalHpp = await this.processStockReduction(itemsForStock, tenantId, trx.order_number, trx.outlet_id);
    await this.saveTransactionJournal(trx, totalHpp, tenantId, trx.outlet_id);

    return true;
  }

  // ==========================================
  // STOCK REDUCTION & BOM
  // ==========================================
  static async processStockReduction(items, tenantId, readableId = null, outletId = null) {
    let totalHpp = 0;

    for (const item of items) {
        const boms = await TransactionRepository.getMenuBOM(item.id, tenantId);
        if (!boms || boms.length === 0) continue;

        for (const b of boms) {
            const usedQty = Number(b.qty_needed || 0) * item.qty;
            let bahanId = b.bahan_id;
            
            let bInfo = await TransactionRepository.getBahanByIdOrName(bahanId, null, tenantId);

            // Legacy mapping fallback
            if (!bInfo && typeof bahanId === 'number') {
                const legacyMap = { 101: 'Biji Kopi Arabica', 102: 'Susu Segar', 103: 'Gula Aren' };
                const legacyName = legacyMap[bahanId];
                if (legacyName) {
                    bInfo = await TransactionRepository.getBahanByIdOrName(null, legacyName, tenantId);
                }
            }

            if (!bInfo) continue;

            const conv = getConversion(bInfo);
            const baseUsedQty = usedQty / conv.ratio;

            const itemHpp = Math.round(baseUsedQty * (bInfo.cost || 0));
            totalHpp += itemHpp;

            const { error: updErr } = await TransactionRepository.decrementStockAtomic(bInfo.id, baseUsedQty, tenantId);

            if (updErr) {
                const newStock = Number(bInfo.stock) - baseUsedQty;
                await TransactionRepository.updateStockDirect(bInfo.id, newStock, tenantId);
            }
            
            await TransactionRepository.insertInventoryLog({
                tenant_id: tenantId,
                outlet_id: outletId,
                bahan_id: bInfo.id,
                bahan_name: bInfo.name,
                type: 'Sales',
                change_qty: -baseUsedQty,
                prev_stock: Number(bInfo.stock),
                next_stock: Number(bInfo.stock) - baseUsedQty,
                reference_id: readableId || 'Sales',
                created_at: new Date().toISOString()
            });
        }
    }
    return Math.round(totalHpp);
  }

  // ==========================================
  // JOURNALING / ACCOUNTING
  // ==========================================
  static async saveTransactionJournal(trxData, totalHpp, tenantId, outletId) {
    try {
        if (!tenantId) {
            await TransactionRepository.logAudit({ action_type: 'JOURNAL_FAIL', table_name: 'journals', description: 'Missing Tenant ID', user_name: 'SYSTEM_JOURNALER', tenant_id: tenantId });
            return false;
        }

        const settings = await TransactionRepository.getSettings(tenantId);
        const amap = settings?.accounting_map || {};

        const codes = [
            amap.cash || '1-1000', 
            amap.sales || '4-1000', 
            amap.hpp || '5-1000', 
            amap.inventory || '1-2000',
            amap.tax || '2-2000'
        ];
        const accounts = await TransactionRepository.getAccountsByCodes(codes);
        
        const getAccountId = (code) => accounts?.find(a => a.code === code)?.id;

        const journalId = crypto.randomUUID();
        const totalAmount = Math.round(trxData.total || 0);
        const taxAmount = Math.round(trxData.tax || 0);
        const netRevenue = totalAmount - taxAmount;

        const journalHeader = {
            id: journalId,
            tenant_id: tenantId,
            date: trxData.created_at || new Date().toISOString(),
            reference: trxData.order_number,
            description: `Sales: ${trxData.order_number} (${trxData.customer_name})`,
            total_amount: totalAmount
        };

        const lines = [
            { journal_id: journalId, account_id: getAccountId(amap.cash || '1-1000'), account_code: amap.cash || '1-1000', account_name: 'Kas/Bank', debit: totalAmount, credit: 0, tenant_id: tenantId },
            { journal_id: journalId, account_id: getAccountId(amap.sales || '4-1000'), account_code: amap.sales || '4-1000', account_name: 'Pendapatan', debit: 0, credit: netRevenue, tenant_id: tenantId }
        ];

        if (taxAmount > 0) {
            lines.push({ journal_id: journalId, account_id: getAccountId(amap.tax || '2-2000'), account_code: amap.tax || '2-2000', account_name: 'Hutang Pajak (PPN)', debit: 0, credit: taxAmount, tenant_id: tenantId });
        }

        if (totalHpp > 0) {
            lines.push(
                { journal_id: journalId, account_id: getAccountId(amap.hpp || '5-1000'), account_code: amap.hpp || '5-1000', account_name: 'HPP', debit: Math.round(totalHpp), credit: 0, tenant_id: tenantId },
                { journal_id: journalId, account_id: getAccountId(amap.inventory || '1-2000'), account_code: amap.inventory || '1-2000', account_name: 'Persediaan', debit: 0, credit: Math.round(totalHpp), tenant_id: tenantId }
            );
        }

        const validLines = lines.filter(l => l.account_id);
        if (validLines.length < 2) {
            await TransactionRepository.logAudit({ action_type: 'JOURNAL_FAIL', table_name: 'journals', description: `Hanya menemukan ${validLines.length} akun yang valid`, user_name: 'SYSTEM_JOURNALER', tenant_id: tenantId });
            return false;
        }

        try {
            await TransactionRepository.insertJournalHeader(journalHeader);
            await TransactionRepository.insertJournalLines(validLines);
            return true;
        } catch (err) {
            await TransactionRepository.logAudit({ action_type: 'JOURNAL_ERROR', table_name: 'journals', description: `Insert Fail: ${err.message}`, user_name: 'SYSTEM_JOURNALER', tenant_id: tenantId });
            return false;
        }

    } catch (err) {
        await TransactionRepository.logAudit({ action_type: 'JOURNAL_ERROR', table_name: 'journals', description: `CRITICAL: ${err.message}`, user_name: 'SYSTEM_JOURNALER', tenant_id: tenantId });
        return false;
    }
  }

  // ==========================================
  // OTHERS
  // ==========================================
  static async updateKdsStatus(id, status) {
    const trx = await TransactionRepository.getTransactionById(id);
    if (!trx) throw new Error('Not found');

    const newItems = { ...trx.items, kds_status: status };
    await TransactionRepository.updateTransaction(id, { items: newItems });
    return true;
  }

  static async requestVoid(id, reason, role) {
    await TransactionRepository.logAudit({
        action_type: 'REQUEST_VOID',
        table_name: 'transactions',
        description: `Kasir meminta VOID untuk transaksi ${id}. Alasan: ${reason}`,
        user_name: role || 'Kasir'
    });
    await TransactionRepository.updateTransaction(id, { payment_status: 'pending_void_approval' });
    return true;
  }

  static async approveVoid(id, role) {
    if (role !== 'manager' && role !== 'owner' && role !== 'superadmin') {
        throw new Error('RBAC: Hanya Manager/Owner yang dapat menyetujui VOID');
    }

    const oldTx = await TransactionRepository.getTransactionById(id);
    if (!oldTx) throw new Error('Not found');

    if (oldTx.payment_status === 'void') return true;

    const tenantId = oldTx.tenant_id;
    let itemsForStock = [];
    const items = await TransactionRepository.getTransactionItems(id);
    if (items && items.length > 0) {
        itemsForStock = items.map(i => ({ id: i.menu_id, qty: i.qty }));
    } else if (oldTx.items && oldTx.items.items) {
        itemsForStock = oldTx.items.items.map(i => ({ id: i.id, qty: i.qty }));
    }

    let totalHppReversed = 0;
    for (const item of itemsForStock) {
        const boms = await TransactionRepository.getMenuBOM(item.id, tenantId);
        if (!boms || boms.length === 0) continue;

        for (const b of boms) {
            const usedQty = Number(b.qty_needed || 0) * item.qty;
            let bahanId = b.bahan_id;
            let bInfo = await TransactionRepository.getBahanByIdOrName(bahanId, null, tenantId);

            if (!bInfo && typeof bahanId === 'number') {
                const legacyMap = { 101: 'Biji Kopi Arabica', 102: 'Susu Segar', 103: 'Gula Aren' };
                const legacyName = legacyMap[bahanId];
                if (legacyName) {
                    bInfo = await TransactionRepository.getBahanByIdOrName(null, legacyName, tenantId);
                }
            }
            if (!bInfo) continue;

            const conv = getConversion(bInfo);
            const baseUsedQty = usedQty / conv.ratio;
            totalHppReversed += Math.round(baseUsedQty * (bInfo.cost || 0));

            const { error: updErr } = await TransactionRepository.decrementStockAtomic(bInfo.id, -baseUsedQty, tenantId);
            if (updErr) {
                const newStock = Number(bInfo.stock) + baseUsedQty;
                await TransactionRepository.updateStockDirect(bInfo.id, newStock, tenantId);
            }
            await TransactionRepository.insertInventoryLog({
                tenant_id: tenantId,
                outlet_id: oldTx.outlet_id,
                bahan_id: bInfo.id,
                bahan_name: bInfo.name,
                type: 'Restock_Void',
                change_qty: baseUsedQty,
                prev_stock: Number(bInfo.stock),
                next_stock: Number(bInfo.stock) + baseUsedQty,
                reference_id: oldTx.order_number || 'Void',
                created_at: new Date().toISOString()
            });
        }
    }

    if (oldTx.payment_status === 'paid') {
        const settings = await TransactionRepository.getSettings(tenantId);
        const amap = settings?.accounting_map || {};
        const codes = [
            amap.cash || '1-1000', 
            amap.sales || '4-1000', 
            amap.hpp || '5-1000', 
            amap.inventory || '1-2000',
            amap.tax || '2-2000'
        ];
        const accounts = await TransactionRepository.getAccountsByCodes(codes);
        const getAccountId = (code) => accounts?.find(a => a.code === code)?.id;

        const journalId = crypto.randomUUID();
        const totalAmount = Math.round(oldTx.total || 0);
        const taxAmount = Math.round(oldTx.tax || 0);
        const netRevenue = totalAmount - taxAmount;

        const journalHeader = {
            id: journalId,
            tenant_id: tenantId,
            date: new Date().toISOString(),
            reference: 'VOID-' + oldTx.order_number,
            description: `VOID Sales: ${oldTx.order_number}`,
            total_amount: totalAmount
        };

        const lines = [
            { journal_id: journalId, account_id: getAccountId(amap.cash || '1-1000'), account_code: amap.cash || '1-1000', account_name: 'Kas/Bank', debit: 0, credit: totalAmount, tenant_id: tenantId },
            { journal_id: journalId, account_id: getAccountId(amap.sales || '4-1000'), account_code: amap.sales || '4-1000', account_name: 'Pendapatan', debit: netRevenue, credit: 0, tenant_id: tenantId }
        ];

        if (taxAmount > 0) {
            lines.push({ journal_id: journalId, account_id: getAccountId(amap.tax || '2-2000'), account_code: amap.tax || '2-2000', account_name: 'Hutang Pajak (PPN)', debit: taxAmount, credit: 0, tenant_id: tenantId });
        }

        if (totalHppReversed > 0) {
            lines.push(
                { journal_id: journalId, account_id: getAccountId(amap.hpp || '5-1000'), account_code: amap.hpp || '5-1000', account_name: 'HPP', debit: 0, credit: Math.round(totalHppReversed), tenant_id: tenantId },
                { journal_id: journalId, account_id: getAccountId(amap.inventory || '1-2000'), account_code: amap.inventory || '1-2000', account_name: 'Persediaan', debit: Math.round(totalHppReversed), credit: 0, tenant_id: tenantId }
            );
        }

        const validLines = lines.filter(l => l.account_id);
        if (validLines.length >= 2) {
            try {
                await TransactionRepository.insertJournalHeader(journalHeader);
                await TransactionRepository.insertJournalLines(validLines);
            } catch (err) {
                console.warn("Gagal mencatat jurnal VOID:", err.message);
            }
        }
    }

    await TransactionRepository.logAudit({
        action_type: 'APPROVE_VOID',
        table_name: 'transactions',
        description: `Manager menyetujui VOID untuk transaksi ${id}.`,
        user_name: role,
        old_value: oldTx,
        new_value: { ...oldTx, payment_status: 'void' }
    });

    await TransactionRepository.updateTransaction(id, { payment_status: 'void' });
    return true;
  }

  static async getTrendReport(tenantId) {
    const data = await TransactionRepository.getRecentPaidTransactions(tenantId, 7);
    
    const daily = {};
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = days[d.getDay()];
        daily[label] = 0;
    }

    (data || []).forEach(tx => {
        const date = new Date(tx.created_at);
        const label = days[date.getDay()];
        if (daily[label] !== undefined) {
            daily[label] += Number(tx.total) || 0;
        }
    });

    return Object.keys(daily).map(label => ({
        label,
        value: daily[label]
    }));
  }

  static async getTopSelling(tenantId) {
    const data = await TransactionRepository.getTopSellingItems(tenantId);
    
    const stats = data.reduce((acc, item) => {
        const id = item.menu_id;
        if (!acc[id]) acc[id] = { ...item.menu, id, salesCount: 0 };
        acc[id].salesCount += item.qty;
        return acc;
    }, {});

    return Object.values(stats).sort((a, b) => b.salesCount - a.salesCount).slice(0, 5);
  }
}

module.exports = TransactionService;

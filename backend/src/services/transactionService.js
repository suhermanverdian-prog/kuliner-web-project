const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const TransactionRepository = require('../repositories/transactionRepository');
const FifoRepository = require('../repositories/fifoRepository');
const { getConversion } = require('../utils/conversion');

class TransactionService {

  // ==========================================
  // TRANSACTION CREATION & VALIDATION
  // ==========================================
  static async createTransaction(trxData, tenantId, outletId, isOfflineAllowed = true) {
    const {
      customer_name: customerName,
      customer_phone: customerPhone,
      promo_code: promoCode,
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
    const paymentStatus = (isSelfOrder && paymentMethod !== 'Tunai' && !cashierName.includes('(Paid)')) ? 'pending_payment' : 'paid';

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

    // Auto-enrich items with menu names if missing or for absolute KDS visibility
    const menuIds = items.map(item => item.id).filter(Boolean);
    let menuNamesMap = {};
    let skipKdsMap = {};
    try {
        const menus = await TransactionRepository.getMenuNames(menuIds, tenantId);
        menus.forEach(m => {
            menuNamesMap[m.id] = m.name;
            skipKdsMap[m.id] = m.skip_kds === true;
        });
    } catch (err) {
        console.warn('⚠️ [POS-Enrichment] Failed to fetch menu names for KDS enrichment:', err.message);
    }

    const enrichedItems = items.map(item => ({
        ...item,
        name: item.name || menuNamesMap[item.id] || 'Menu Item',
        skip_kds: item.skip_kds !== undefined ? item.skip_kds : (skipKdsMap[item.id] || false)
    }));

    const isComplimentary = paymentMethod === 'Complimentary' || paymentMethod === 'Staff Benefit';
    const finalTotal = isComplimentary ? 0 : calculatedTotal;
    const finalTax = isComplimentary ? 0 : cleanTax;
    const finalDiscount = isComplimentary ? calculatedSubtotal : cleanDiscount;

    const trxPayload = {
        id: supabaseId,
        order_number: readableId,
        tenant_id: tenantId,
        outlet_id: outletId || null,
        total: finalTotal, 
        tax: finalTax,
        discount: finalDiscount,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        customer_name: customerName,
        payment_breakdown: trxData.payment_breakdown || null,
        partner_id: trxData.partner_id || null,
        created_at: created_at || new Date().toISOString(),
        items: {
            kds_status: 'new',
            table_type: tableType,
            cashier_name: cashierName,
            customer_phone: customerPhone || null,
            promo_code: promoCode || null,
            items: enrichedItems
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
            console.error(`🚨 [StrictRollback] Kegagalan kritis dalam transaksi ${readableId}:`, rollbackErr);
            
            // Rollback
            try {
              await TransactionRepository.deleteTransactionHeader(supabaseId);
            } catch (delErr) {
              console.error('🚨 [StrictRollback] GAGAL total saat menghapus Header Transaksi:', delErr);
            }

            throw new Error(`Transaksi dibatalkan demi konsistensi database: ${rollbackErr.message || rollbackErr}`);
        }
    }

    // --- SPRINT 2 INTEGRATION: Loyalty & Promo Code Post-Processing ---
    if (!isOffline) {
        if (paymentStatus === 'paid' && customerPhone) {
            try {
                const LoyaltyService = require('./loyaltyService');
                await LoyaltyService.earnPoints(tenantId, customerPhone, customerName, finalTotal);
            } catch (lErr) {
                console.warn('⚠️ [Loyalty] Non-blocking exception earning points on checkout:', lErr.message);
            }
        }
        if (promoCode) {
            try {
                const PromoCodeRepository = require('../repositories/promoCodeRepository');
                const promo = await PromoCodeRepository.findByCode(tenantId, promoCode);
                if (promo) {
                    await PromoCodeRepository.update(tenantId, promo.id, {
                        used_count: (promo.used_count || 0) + 1
                    });
                }
            } catch (pErr) {
                console.warn('⚠️ [Promo] Non-blocking exception incrementing used count:', pErr.message);
            }
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

    // --- SPRINT 2 INTEGRATION: Loyalty Points on Confirmation ---
    let customerPhone = null;
    let customerName = trx.customer_name || 'Tamu';
    if (trx.items) {
        let itemsField = trx.items;
        if (typeof itemsField === 'string') {
            try { itemsField = JSON.parse(itemsField); } catch (e) {}
        }
        if (itemsField && typeof itemsField === 'object') {
            customerPhone = itemsField.customer_phone;
        }
    }
    
    if (customerPhone) {
        try {
            const LoyaltyService = require('./loyaltyService');
            await LoyaltyService.earnPoints(tenantId, customerPhone, customerName, trx.total);
        } catch (lErr) {
            console.warn('⚠️ [Loyalty] Non-blocking exception earning points on confirmation:', lErr.message);
        }
    }

    return true;
  }

  // ==========================================
  // STOCK REDUCTION & BOM
  // ==========================================
  static async processStockReduction(items, tenantId, readableId = null, outletId = null) {
    let totalHpp = 0;

    for (const item of items) {
        const cust = item.customization || {};
        
        // 1. Ambil resep dasar (BOM) atau resep kustom dinamis dari kasir
        let resolvedBoms = [];

        if (Array.isArray(cust.customRecipe) && cust.customRecipe.length > 0) {
            // Gunakan resep kustom dinamis (Eksklusi & Substitusi Bahan Baku dari POS)
            for (const r of cust.customRecipe) {
                if (r.active && Number(r.qty) > 0) {
                    const bInfo = await TransactionRepository.getBahanByIdOrName(r.bahanId, null, tenantId);
                    if (bInfo) {
                        resolvedBoms.push({
                            bahan_id: bInfo.id,
                            bahan_name: bInfo.name,
                            qty_needed: Number(r.qty || 0),
                            isCup: bInfo.name.toLowerCase().includes('cup'),
                            isMilk: bInfo.name.toLowerCase().includes('susu') || bInfo.name.toLowerCase().includes('milk'),
                            isCoffee: bInfo.name.toLowerCase().includes('kopi') || bInfo.name.toLowerCase().includes('coffee')
                        });
                    }
                }
            }
        } else {
            const baseBoms = await TransactionRepository.getMenuBOM(item.id, tenantId) || [];
            // Ambil info lengkap bahan untuk resep dasar
            for (const b of baseBoms) {
                let bInfo = await TransactionRepository.getBahanByIdOrName(b.bahan_id, null, tenantId);
                if (!bInfo && typeof b.bahan_id === 'number') {
                    const legacyMap = { 101: 'Biji Kopi Arabica', 102: 'Susu Segar', 103: 'Gula Aren' };
                    const legacyName = legacyMap[b.bahan_id];
                    if (legacyName) {
                        bInfo = await TransactionRepository.getBahanByIdOrName(null, legacyName, tenantId);
                    }
                }
                if (bInfo) {
                    resolvedBoms.push({
                        bahan_id: bInfo.id,
                        bahan_name: bInfo.name,
                        qty_needed: Number(b.qty_needed || 0),
                        isCup: bInfo.name.toLowerCase().includes('cup'),
                        isMilk: bInfo.name.toLowerCase().includes('susu') || bInfo.name.toLowerCase().includes('milk'),
                        isCoffee: bInfo.name.toLowerCase().includes('kopi') || bInfo.name.toLowerCase().includes('coffee')
                    });
                }
            }
        }

        // 2. PROSES DYNAMIC CUSTOMIZATION MAPPING
        
        // A. Substitusi Cup berdasarkan Ukuran (S, M, L, XL)
        if (cust.size) {
            const sizeMap = {
                'S': 'Cup Small',
                'R': 'Cup Regular',
                'M': 'Cup Medium',
                'L': 'Cup Large',
                'XL': 'Cup Extra Large'
            };
            const targetCupName = sizeMap[cust.size];
            if (targetCupName) {
                const targetCupBahan = await TransactionRepository.getBahanByIdOrName(null, targetCupName, tenantId);
                if (targetCupBahan) {
                    // Cari cup di resep dasar dan ganti, atau tambahkan jika tidak ada
                    const cupIdx = resolvedBoms.findIndex(b => b.isCup);
                    if (cupIdx > -1) {
                        resolvedBoms[cupIdx].bahan_id = targetCupBahan.id;
                        resolvedBoms[cupIdx].bahan_name = targetCupBahan.name;
                    } else {
                        resolvedBoms.push({
                            bahan_id: targetCupBahan.id,
                            bahan_name: targetCupBahan.name,
                            qty_needed: 1
                        });
                    }
                }
            }
        }

        if (!Array.isArray(cust.customRecipe) || cust.customRecipe.length === 0) {
            // B. Substitusi Susu (Oat Milk, Almond Milk, dll.)
            if (cust.milk) {
                const defaultMilkQty = Number(cust.milkDose || 150);
                if (cust.milk === 'no-milk') {
                    // Hapus susu dari resep jika "tanpa susu"
                    resolvedBoms = resolvedBoms.filter(b => !b.isMilk);
                } else if (cust.milk !== 'regular') {
                    const milkMap = {
                        'oat': 'Oat Milk',
                        'almond': 'Almond Milk',
                        'soy': 'Soy Milk'
                    };
                    const targetMilkName = milkMap[cust.milk];
                    if (targetMilkName) {
                        const targetMilkBahan = await TransactionRepository.getBahanByIdOrName(null, targetMilkName, tenantId);
                        if (targetMilkBahan) {
                            const milkIdx = resolvedBoms.findIndex(b => b.isMilk);
                            if (milkIdx > -1) {
                                resolvedBoms[milkIdx].bahan_id = targetMilkBahan.id;
                                resolvedBoms[milkIdx].bahan_name = targetMilkBahan.name;
                            } else {
                                // Tambah porsi default
                                resolvedBoms.push({
                                    bahan_id: targetMilkBahan.id,
                                    bahan_name: targetMilkBahan.name,
                                    qty_needed: defaultMilkQty
                                });
                            }
                        }
                    }
                }
            }

            // C. Tambahan Shot Espresso (Double, Triple Shot)
            if (cust.strength && cust.strength !== 'standard') {
                const extraShots = cust.strength === 'single' ? 1 : cust.strength === 'double' ? 2 : cust.strength === 'triple' ? 3 : 0;
                const shotDose = Number(cust.espressoDose || 7); // Brand-specific shot dose
                const extraCoffeeGrams = extraShots * shotDose;
                
                const coffeeIdx = resolvedBoms.findIndex(b => b.isCoffee);
                if (coffeeIdx > -1) {
                    resolvedBoms[coffeeIdx].qty_needed += extraCoffeeGrams;
                } else {
                    // Cari bahan biji kopi arabika atau kopi default
                    const coffeeBahan = await TransactionRepository.getBahanByIdOrName(null, 'Biji Kopi Arabica', tenantId) || 
                                         await TransactionRepository.getBahanByIdOrName(null, 'Biji Kopi', tenantId);
                    if (coffeeBahan) {
                        resolvedBoms.push({
                            bahan_id: coffeeBahan.id,
                            bahan_name: coffeeBahan.name,
                            qty_needed: extraCoffeeGrams
                        });
                    }
                }
            }

            // D. Tambahan Topping / Extras
            if (Array.isArray(cust.extras) && cust.extras.length > 0) {
                const extrasMap = {
                    'whipped_cream': { name: 'Whipped Cream', qty: 15 },
                    'cocoa_powder': { name: 'Cocoa Powder', qty: 5 },
                    'caramel_drizzle': { name: 'Sirup Karamel', qty: 10 },
                    'vanilla_syrup': { name: 'Sirup Vanila', qty: 15 },
                    'hazelnut_syrup': { name: 'Sirup Hazelnut', qty: 15 },
                    'cinnamon': { name: 'Kayu Manis Bubuk', qty: 3 }
                };

                for (const extraKey of cust.extras) {
                    const conf = extrasMap[extraKey];
                    if (conf) {
                        const extraBahan = await TransactionRepository.getBahanByIdOrName(null, conf.name, tenantId);
                        if (extraBahan) {
                            const customQty = cust.extrasDoses && cust.extrasDoses[extraKey] !== undefined ? Number(cust.extrasDoses[extraKey]) : conf.qty;
                            // Tambah ke resep
                            resolvedBoms.push({
                                journal_id: extraBahan.id, // compatibility
                                bahan_id: extraBahan.id,
                                bahan_name: extraBahan.name,
                                qty_needed: customQty
                            });
                        }
                    }
                }
            }
        }

        // 3. EKSEKUSI PENGURANGAN STOK FIFO & RECORD LOGS
        for (const b of resolvedBoms) {
            const usedQty = b.qty_needed * item.qty;
            const bInfo = await TransactionRepository.getBahanByIdOrName(b.bahan_id, null, tenantId);
            if (!bInfo) continue;

            const conv = getConversion(bInfo);
            const baseUsedQty = usedQty / conv.ratio;

            try {
                const itemHpp = await FifoRepository.deductStockFifo(tenantId, bInfo.id, baseUsedQty);
                totalHpp += itemHpp;
            } catch (fifoErr) {
                console.error("⚠️ [FIFO Error] Gagal menghitung HPP via FIFO, fallback ke average cost:", fifoErr.message);
                const itemHpp = Math.round(baseUsedQty * (bInfo.cost || 0));
                totalHpp += itemHpp;
            }

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

        // B2B Receivable account mapping (fallback code: '1-1030' or custom map)
        const b2bAccountCode = amap.b2b_receivable || '1-1030';

        const codes = [
            amap.cash || '1-1000', 
            amap.sales || '4-1000', 
            amap.hpp || '5-1000', 
            amap.inventory || '1-2000',
            amap.tax || '2-2000',
            b2bAccountCode,
            '5-2000'
        ];
        const accounts = await TransactionRepository.getAccountsByCodes(codes);
        
        const getAccountId = (code) => accounts?.find(a => a.code === code)?.id;

        const journalId = crypto.randomUUID();
        const totalAmount = Math.round(trxData.total || 0);
        const taxAmount = Math.round(trxData.tax || 0);
        const netRevenue = totalAmount - taxAmount;

        const isComplimentary = trxData.payment_method === 'Complimentary' || trxData.payment_method === 'Staff Benefit';
        const isB2B = trxData.payment_method === 'B2B Billing' || trxData.partner_id;

        const journalHeader = {
            id: journalId,
            tenant_id: tenantId,
            date: trxData.created_at || new Date().toISOString(),
            reference: trxData.order_number,
            description: isComplimentary 
                ? `Complimentary Order: ${trxData.order_number} (${trxData.customer_name}) - Method: ${trxData.payment_method}`
                : isB2B 
                  ? `B2B Sales: ${trxData.order_number} (${trxData.customer_name})`
                  : `Sales: ${trxData.order_number} (${trxData.customer_name})`,
            total_amount: isComplimentary ? Math.round(totalHpp || 0) : totalAmount
        };

        let lines = [];
        if (isComplimentary) {
            const expenseCode = '5-2000';
            const inventoryCode = amap.inventory || '1-2000';
            const hppValue = Math.round(totalHpp || 0);

            if (hppValue > 0) {
                lines.push(
                    { journal_id: journalId, account_id: getAccountId(expenseCode) || getAccountId('5-2000'), account_code: expenseCode, account_name: 'Beban Operasional / Waste', debit: hppValue, credit: 0, tenant_id: tenantId },
                    { journal_id: journalId, account_id: getAccountId(inventoryCode), account_code: inventoryCode, account_name: 'Persediaan', debit: 0, credit: hppValue, tenant_id: tenantId }
                );
            } else {
                console.log(`ℹ️ [POS-Journal] Complimentary transaction ${trxData.order_number} has 0 HPP. Skipping journal creation.`);
                return true; 
            }
        } else {
            // Split payment logic (Cash/Cashless + B2B Receivable)
            let cashPart = totalAmount;
            let b2bPart = 0;

            // Extract split values from breakdown if available
            if (trxData.payment_breakdown) {
                const breakdown = typeof trxData.payment_breakdown === 'string' 
                    ? JSON.parse(trxData.payment_breakdown) 
                    : trxData.payment_breakdown;
                
                if (breakdown.cash !== undefined || breakdown.b2b !== undefined) {
                    cashPart = Math.round(breakdown.cash || 0);
                    b2bPart = Math.round(breakdown.b2b || 0);
                }
            } else if (trxData.payment_method === 'B2B Billing') {
                cashPart = 0;
                b2bPart = totalAmount;
            }

            // Debit Cash if any
            if (cashPart > 0) {
                lines.push({ journal_id: journalId, account_id: getAccountId(amap.cash || '1-1000'), account_code: amap.cash || '1-1000', account_name: 'Kas/Bank', debit: cashPart, credit: 0, tenant_id: tenantId });
            }

            // Debit B2B Accounts Receivable if any
            if (b2bPart > 0) {
                // Autocreate Accounts Receivable Account if missing
                let b2bAccountId = getAccountId(b2bAccountCode);
                if (!b2bAccountId) {
                    try {
                        const newAcc = await AccountingRepository.createAccount({
                            tenant_id: tenantId,
                            code: b2bAccountCode,
                            name: 'Piutang Kemitraan (B2B)',
                            category: 'Asset',
                            normal_balance: 'Debit'
                        });
                        b2bAccountId = newAcc.id;
                    } catch (accErr) {
                        console.error('Failed to auto-create B2B account:', accErr);
                    }
                }
                lines.push({ journal_id: journalId, account_id: b2bAccountId, account_code: b2bAccountCode, account_name: 'Piutang Kemitraan (B2B)', debit: b2bPart, credit: 0, tenant_id: tenantId });
            }

            // Credit Revenue & Taxes
            lines.push({ journal_id: journalId, account_id: getAccountId(amap.sales || '4-1000'), account_code: amap.sales || '4-1000', account_name: 'Pendapatan', debit: 0, credit: netRevenue, tenant_id: tenantId });

            if (taxAmount > 0) {
                lines.push({ journal_id: journalId, account_id: getAccountId(amap.tax || '2-2000'), account_code: amap.tax || '2-2000', account_name: 'Hutang Pajak (PPN)', debit: 0, credit: taxAmount, tenant_id: tenantId });
            }

            // Inventory and HPP
            if (totalHpp > 0) {
                lines.push(
                    { journal_id: journalId, account_id: getAccountId(amap.hpp || '5-1000'), account_code: amap.hpp || '5-1000', account_name: 'HPP', debit: Math.round(totalHpp), credit: 0, tenant_id: tenantId },
                    { journal_id: journalId, account_id: getAccountId(amap.inventory || '1-2000'), account_code: amap.inventory || '1-2000', account_name: 'Persediaan', debit: 0, credit: Math.round(totalHpp), tenant_id: tenantId }
                );
            }
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

  static async requestVoid(id, reason, role, name, tenantId) {
    const oldTx = await TransactionRepository.getTransactionById(id);
    if (!oldTx) throw new Error('Transaksi tidak ditemukan');

    await TransactionRepository.logAudit({
        tenant_id: tenantId || oldTx.tenant_id,
        activity_type: 'ORDER_DELETE',
        description: `Meminta VOID untuk transaksi #${oldTx.order_number}. Alasan: ${reason || '-'}`,
        user_name: name || 'Kasir',
        role: role || 'Kasir'
    });
    await TransactionRepository.updateTransaction(id, { payment_status: 'pending_void_approval' });
    return true;
  }

  static async approveVoid(id, role, name, userTenantId) {
    const oldTx = await TransactionRepository.getTransactionById(id);
    if (!oldTx) throw new Error('Not found');

    const tenantId = oldTx.tenant_id;
    const settings = await TransactionRepository.getSettings(tenantId);
    const approvers = settings?.void_approvers || ['owner', 'manager'];
    console.log('🔍 [Debug approveVoid Service] Settings loaded:', settings, 'Approvers:', approvers, 'Role:', role);

    if (!approvers.includes(role) && role !== 'superadmin') {
        throw new Error(`RBAC: Role '${role}' tidak diizinkan menyetujui VOID oleh pengaturan sistem.`);
    }

    if (oldTx.payment_status === 'void') return true;
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
            tenant_id: oldTx.tenant_id,
            date: new Date().toISOString(),
            reference: 'VOID-' + oldTx.order_number,
            description: `VOID Sales: ${oldTx.order_number}`,
            total_amount: totalAmount
        };

        const lines = [
            { journal_id: journalId, account_id: getAccountId(amap.cash || '1-1000'), account_code: amap.cash || '1-1000', account_name: 'Kas/Bank', debit: 0, credit: totalAmount, tenant_id: oldTx.tenant_id },
            { journal_id: journalId, account_id: getAccountId(amap.sales || '4-1000'), account_code: amap.sales || '4-1000', account_name: 'Pendapatan', debit: netRevenue, credit: 0, tenant_id: oldTx.tenant_id }
        ];

        if (taxAmount > 0) {
            lines.push({ journal_id: journalId, account_id: getAccountId(amap.tax || '2-2000'), account_code: amap.tax || '2-2000', account_name: 'Pajak', debit: taxAmount, credit: 0, tenant_id: oldTx.tenant_id });
        }

        if (totalHppReversed > 0) {
            lines.push(
                { journal_id: journalId, account_id: getAccountId(amap.hpp || '5-1000'), account_code: amap.hpp || '5-1000', account_name: 'HPP', debit: 0, credit: Math.round(totalHppReversed), tenant_id: oldTx.tenant_id },
                { journal_id: journalId, account_id: getAccountId(amap.inventory || '1-2000'), account_code: amap.inventory || '1-2000', account_name: 'Persediaan', debit: Math.round(totalHppReversed), credit: 0, tenant_id: oldTx.tenant_id }
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
        tenant_id: oldTx.tenant_id,
        activity_type: 'ORDER_DELETE',
        description: `Menyetujui VOID transaksi #${oldTx.order_number}. Stok dipulihkan sebesar Rp ${totalHppReversed}.`,
        user_name: name || 'System',
        role: role || 'System'
    });

    await TransactionRepository.updateTransaction(id, { payment_status: 'void' });
    return true;
  }

  static async getTrendReport(userContext) {
    const data = await TransactionRepository.getRecentPaidTransactions(userContext, 7);
    
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

  static async getTopSelling(userContext) {
    const data = await TransactionRepository.getTopSellingItems(userContext);
    
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

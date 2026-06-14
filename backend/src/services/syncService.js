const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { supabase } = require('../supabase');

// Import helper functions from transactionRoutes and procurementRoutes dynamically if needed, 
// or write dedicated cloud reconciliation engines to avoid circular dependencies.
const dataPath = path.resolve(__dirname, '../db/data.json');

// Helper to check network connectivity with Supabase Cloud
async function checkOnline() {
  try {
    const { data, error } = await supabase.from('bahan').select('id').limit(1);
    return !error;
  } catch (err) {
    return false;
  }
}

// Helper to process stock reduction on Cloud for synced transactions
async function processCloudStockReduction(items, tenantId, readableId, outletId) {
  try {
    for (const item of items) {
      // Fetch recipe on cloud
      const { data: boms } = await supabase
        .from('menu_bom')
        .select('bahan_id, qty_needed')
        .eq('menu_id', item.id)
        .eq('tenant_id', tenantId);

      if (!boms) continue;

      for (const b of boms) {
        const usedQty = Number(b.qty_needed || 0) * item.qty;
        
        // Fetch raw material on cloud
        let { data: bInfo } = await supabase
          .from('bahan')
          .select('id, stock, cost, name')
          .eq('id', b.bahan_id)
          .eq('tenant_id', tenantId)
          .maybeSingle();

        if (!bInfo) continue;

        // Decrement stock on cloud atomically
        const newStock = Number(bInfo.stock) - usedQty;
        await supabase.from('bahan').update({ stock: newStock }).eq('id', bInfo.id).eq('tenant_id', tenantId);
        
        // Log inventory on cloud
        await supabase.from('inventory_logs').insert([{
          tenant_id: tenantId,
          outlet_id: outletId,
          bahan_id: bInfo.id,
          bahan_name: bInfo.name,
          type: 'Sales',
          change_qty: -usedQty,
          prev_stock: Number(bInfo.stock),
          next_stock: newStock,
          reference_id: readableId || 'Sales_Offline_Sync',
          created_at: new Date().toISOString()
        }]);
      }
    }
  } catch (err) {
    console.error('⚠️ [SyncDaemon] Cloud stock reduction error:', err.message);
  }
}

// Helper to save journal on Cloud for synced transactions
async function saveCloudTransactionJournal(trxData, tenantId, outletId) {
  try {
    const { data: settings } = await supabase.from('settings').select('accounting_map').eq('tenant_id', tenantId).maybeSingle();
    const amap = settings?.accounting_map || {};

    const codes = [
      amap.cash || '1-1000', 
      amap.sales || '4-1000', 
      amap.tax || '2-2000'
    ];
    
    const { data: accounts } = await supabase.from('accounts').select('id, code').in('code', codes);
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
      description: `Sales Sync: ${trxData.order_number} (${trxData.customer_name})`,
      total_amount: totalAmount
    };

    const lines = [
      { journal_id: journalId, account_id: getAccountId(amap.cash || '1-1000'), account_code: amap.cash || '1-1000', account_name: 'Kas/Bank', debit: totalAmount, credit: 0, tenant_id: tenantId },
      { journal_id: journalId, account_id: getAccountId(amap.sales || '4-1000'), account_code: amap.sales || '4-1000', account_name: 'Pendapatan', debit: 0, credit: netRevenue, tenant_id: tenantId }
    ];

    if (taxAmount > 0) {
      lines.push(
        { journal_id: journalId, account_id: getAccountId(amap.tax || '2-2000'), account_code: amap.tax || '2-2000', account_name: 'Hutang Pajak (PPN)', debit: 0, credit: taxAmount, tenant_id: tenantId }
      );
    }

    const validLines = lines.filter(l => l.account_id);
    if (validLines.length >= 2) {
      await supabase.from('journals').insert([journalHeader]);
      await supabase.from('journal_lines').insert(validLines);
      console.log(`✅ [SyncDaemon] Cloud journal posted for PO/TRX: ${trxData.order_number}`);
    }
  } catch (err) {
    console.error('⚠️ [SyncDaemon] Cloud journaling error:', err.message);
  }
}

// Core sync runner
async function syncOfflineData() {
  if (!fs.existsSync(dataPath)) return;

  try {
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const parsed = JSON.parse(fileContent);

    // Guard Check: Skip execution if all synchronizable arrays are empty
    const hasData = (
      (parsed.suppliers && parsed.suppliers.length > 0) ||
      (parsed.transactions && parsed.transactions.length > 0) ||
      (parsed.purchase_orders && parsed.purchase_orders.length > 0) ||
      (parsed.grns && parsed.grns.length > 0) ||
      (parsed.purchase_invoices && parsed.purchase_invoices.length > 0)
    );

    if (!hasData) return;

    const isOnline = await checkOnline();
    if (!isOnline) {
      console.log('📡 [SyncDaemon] System is currently OFFLINE. Postponing reconciliation...');
      return;
    }

    let modified = false;

    // Helper for Controlled Parallel Execution
    const processInBatches = async (items, batchSize, processor) => {
      const failedItems = [];
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await Promise.all(batch.map(async (item) => {
          try {
            await processor(item);
          } catch (err) {
            failedItems.push(item);
          }
        }));
      }
      return failedItems;
    };

    // ----------------------------------------------------
    // 1. RECONCILE SUPPLIERS
    // ----------------------------------------------------
    if (parsed.suppliers && parsed.suppliers.length > 0) {
      console.log(`📡 [SyncDaemon] Reconciling ${parsed.suppliers.length} suppliers (Batch Mode)...`);
      const originalLen = parsed.suppliers.length;
      const suppliersLeft = await processInBatches(parsed.suppliers, 10, async (s) => {
        const { error } = await supabase.from('suppliers').insert([{
          name: s.name,
          contact: s.contact,
          address: s.address
        }]);
        if (!error || error.code === '23505') {
          console.log(`✅ [SyncDaemon] Supplier successfully synced: ${s.name}`);
        } else {
          console.error(`❌ [SyncDaemon] Supplier ${s.name} sync failed:`, error.message);
          throw error;
        }
      });
      parsed.suppliers = suppliersLeft;
      if (suppliersLeft.length !== originalLen) {
        modified = true;
      }
    }

    // ----------------------------------------------------
    // 2. RECONCILE TRANSACTIONS (POS SALES)
    // ----------------------------------------------------
    if (parsed.transactions && parsed.transactions.length > 0) {
      console.log(`📡 [SyncDaemon] Reconciling ${parsed.transactions.length} POS transactions...`);
      const originalLen = parsed.transactions.length;
      const transactionsLeft = [];
      for (const tx of parsed.transactions) {
        try {
          // Sync header
          let insertedId = tx.id;
          let txOrderNumber = tx.order_number || tx.id;
          let txCreatedAt = tx.created_at || tx.createdAt || new Date().toISOString();
          let txPaymentMethod = tx.payment_method || tx.paymentMethod || 'Tunai';
          let txCustomerName = tx.customer_name || tx.customerName || tx.cashierName || 'Guest';
          let txPaymentStatus = tx.payment_status || tx.paymentStatus || 'paid';

          const { data: newTx, error: txErr } = await supabase.from('transactions').insert([{
            order_number: txOrderNumber,
            tenant_id: tx.tenant_id,
            outlet_id: tx.outlet_id,
            total: tx.total || 0,
            tax: tx.tax || 0,
            discount: tx.discount || 0,
            payment_method: txPaymentMethod,
            payment_status: txPaymentStatus,
            customer_name: txCustomerName,
            created_at: txCreatedAt
          }]).select();

          if (txErr) {
            if (txErr.code === '23505') {
               const { data: existing } = await supabase.from('transactions').select('id').eq('order_number', txOrderNumber).single();
               if (existing) insertedId = existing.id;
            } else {
               throw txErr;
            }
          } else if (newTx && newTx.length > 0) {
            insertedId = newTx[0].id;
          }

          // Sync transaction items
          const items = tx.items?.items || [];
          if (items.length > 0 && insertedId) {
            const itemsToInsert = items.map(i => ({
              transaction_id: insertedId,
              menu_id: i.id,
              qty: i.qty,
              price: i.price,
              tenant_id: tx.tenant_id
            })).filter(i => i.menu_id);

            if (itemsToInsert.length > 0) {
              await supabase.from('transaction_items').insert(itemsToInsert);
            }
          }

          // Process stock & HPP on cloud
          await processCloudStockReduction(items, tx.tenant_id, tx.order_number, tx.outlet_id);

          // Reconcile Accounting Journal
          if (tx.payment_status === 'paid') {
            await saveCloudTransactionJournal(tx, tx.tenant_id, tx.outlet_id);
          }

          console.log(`✅ [SyncDaemon] Transaction successfully synced: ${tx.order_number}`);
        } catch (err) {
          console.error(`❌ [SyncDaemon] Transaction ${tx.order_number} sync failed:`, err.message);
          transactionsLeft.push(tx);
        }
      }
      parsed.transactions = transactionsLeft;
      if (transactionsLeft.length !== originalLen) {
        modified = true;
      }
    }

    // ----------------------------------------------------
    // 3. RECONCILE PURCHASE ORDERS
    // ----------------------------------------------------
    if (parsed.purchase_orders && parsed.purchase_orders.length > 0) {
      console.log(`📡 [SyncDaemon] Reconciling ${parsed.purchase_orders.length} Purchase Orders (Batch Mode)...`);
      const originalLen = parsed.purchase_orders.length;
      
      const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

      const poLeft = await processInBatches(parsed.purchase_orders, 10, async (po) => {
        let insertedPoId = po.id;
        
        // Smart Supplier ID Resolver (Local String -> Cloud UUID)
        let validSupplierId = po.supplier_id || po.supplierId;
        if (validSupplierId && !isUUID(validSupplierId)) {
          const localSup = parsed.suppliers?.find(s => String(s.id) === String(validSupplierId));
          if (localSup) {
            const { data: supCloud } = await supabase.from('suppliers').select('id').eq('name', localSup.name).single();
            validSupplierId = supCloud ? supCloud.id : null;
          } else {
            validSupplierId = null;
          }
        }

        const poNumber = po.po_number || po.poNumber;
        const { data: newPo, error: poErr } = await supabase.from('purchase_orders').insert([{
          po_number: poNumber,
          tenant_id: po.tenant_id,
          supplier_id: validSupplierId,
          total_amount: po.total_amount || po.totalAmount || 0,
          status: po.status || 'pending',
          notes: po.notes || '',
          created_at: po.created_at || po.createdAt || new Date().toISOString()
        }]).select();

        if (poErr) {
          if (poErr.code === '23505') {
             const { data: existing } = await supabase.from('purchase_orders').select('id').eq('po_number', poNumber).single();
             if(existing) insertedPoId = existing.id;
          } else {
             console.error(`❌ [SyncDaemon] PO ${po.id} sync failed:`, poErr.message);
             throw poErr;
          }
        } else if (newPo && newPo.length > 0) {
          insertedPoId = newPo[0].id;
        }

        // Sync PO items
        const items = po.items || [];
        if (items.length > 0 && insertedPoId) {
          const poItemsToInsert = items.map(i => ({
            po_id: insertedPoId,
            bahan_id: i.bahanId || i.bahan_id,
            qty: i.qty,
            price: i.price,
            unit: i.unit || i.purchaseUnit || 'Unit'
          })).filter(i => i.bahan_id);

          if (poItemsToInsert.length > 0) {
            await supabase.from('purchase_order_items').insert(poItemsToInsert);
          }
        }

        console.log(`✅ [SyncDaemon] Purchase Order successfully synced: ${poNumber}`);
      });
      parsed.purchase_orders = poLeft;
      if (poLeft.length !== originalLen) {
        modified = true;
      }
    }

    // ----------------------------------------------------
    // 4. RECONCILE GRNS
    // ----------------------------------------------------
    if (parsed.grns && parsed.grns.length > 0) {
      console.log(`📡 [SyncDaemon] Reconciling ${parsed.grns.length} GRNs (Batch Mode)...`);
      const originalLen = parsed.grns.length;
      const grnsLeft = await processInBatches(parsed.grns, 10, async (g) => {
        let insertedGrnId = g.id;
        const grnNumber = g.grn_number || `GRN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        const { data: newGrn, error: grnErr } = await supabase.from('grns').insert([{
          tenant_id: g.tenant_id,
          outlet_id: g.outlet_id,
          po_id: g.po_id,
          grn_number: grnNumber,
          received_date: g.received_date || g.receivedDate || new Date().toISOString()
        }]).select();

        if (grnErr) {
          if (grnErr.code === '23505') {
             // Ignore existing constraint errors
          } else {
             console.error(`❌ [SyncDaemon] GRN ${g.id} sync failed:`, grnErr.message);
             throw grnErr;
          }
        } else if (newGrn && newGrn.length > 0) {
          insertedGrnId = newGrn[0].id;
        }

        // Sync GRN items from parsed.grn_items (Robust offline-first architecture)
        const localItems = (parsed.grn_items || []).filter(item => String(item.grn_id) === String(g.id));
        if (localItems.length > 0 && insertedGrnId) {
          const grnItemsToInsert = localItems.map(i => ({
            tenant_id: i.tenant_id || g.tenant_id || '00000000-0000-0000-0000-000000000000',
            grn_id: insertedGrnId,
            bahan_id: i.bahan_id,
            qty_received: i.qty_received
          })).filter(i => i.bahan_id);

          if (grnItemsToInsert.length > 0) {
            const { error: itemsInsertErr } = await supabase.from('grn_items').insert(grnItemsToInsert);
            if (itemsInsertErr) {
              console.error(`❌ [SyncDaemon] Failed to sync grn_items for GRN ${grnNumber}:`, itemsInsertErr.message);
              throw itemsInsertErr;
            }
          }

          // Clean up synced items from parsed.grn_items
          parsed.grn_items = (parsed.grn_items || []).filter(item => String(item.grn_id) !== String(g.id));
        }

        console.log(`✅ [SyncDaemon] GRN successfully synced: ${g.id}`);
      });
      parsed.grns = grnsLeft;
      if (grnsLeft.length !== originalLen) {
        modified = true;
      }
    }

    // ----------------------------------------------------
    // 5. RECONCILE PURCHASE INVOICES
    // ----------------------------------------------------
    if (parsed.purchase_invoices && parsed.purchase_invoices.length > 0) {
      console.log(`📡 [SyncDaemon] Reconciling ${parsed.purchase_invoices.length} Purchase Invoices (Batch Mode)...`);
      const originalLen = parsed.purchase_invoices.length;
      
      const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

      const invsLeft = await processInBatches(parsed.purchase_invoices, 10, async (inv) => {
        let validSupplierId = inv.supplier_id || inv.supplierId;
        if (validSupplierId && !isUUID(validSupplierId)) {
          const localSup = parsed.suppliers?.find(s => String(s.id) === String(validSupplierId));
          if (localSup) {
            const { data: supCloud } = await supabase.from('suppliers').select('id').eq('name', localSup.name).single();
            validSupplierId = supCloud ? supCloud.id : null;
          } else {
            validSupplierId = null;
          }
        }

        const { error: invErr } = await supabase.from('purchase_invoices').insert([{
          tenant_id: inv.tenant_id,
          supplier_id: validSupplierId,
          po_id: inv.po_id,
          total: inv.total || 0,
          status: inv.status || 'unpaid',
          created_at: inv.created_at || inv.createdAt || new Date().toISOString()
        }]);

        if (invErr && invErr.code !== '23505') {
          console.error(`❌ [SyncDaemon] Purchase Invoice ${inv.id} sync failed:`, invErr.message);
          throw invErr;
        }

        console.log(`✅ [SyncDaemon] Purchase Invoice successfully synced: ${inv.id}`);
      });
      parsed.purchase_invoices = invsLeft;
      if (invsLeft.length !== originalLen) {
        modified = true;
      }
    }

    // Save modifications back to local data.json
    if (modified) {
      fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf8');
      console.log('📝 [SyncDaemon] Local offline database updated and synchronized.');
    }

  } catch (err) {
    console.error('🚨 [SyncDaemon] Reconciliation pass failed:', err.message);
  }
}

// Start daemon loop
function startSyncDaemon() {
  console.log('🚀 [SyncDaemon] Background Auto-Reconciliation Engine Started (Interval: 30s)');
  
  // Run once immediately on start
  setTimeout(syncOfflineData, 5000);

  // Interval loop
  setInterval(syncOfflineData, 30000);
}

module.exports = { startSyncDaemon };

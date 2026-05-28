const fs = require('fs');
const path = require('path');
const ProcurementRepository = require('../repositories/procurementRepository');

class ProcurementService {
  
  // ==========================================
  // PURCHASE ORDERS (POS)
  // ==========================================
  static async getPurchaseOrders(tenantId, filters) {
    const poData = await ProcurementRepository.getPurchaseOrders(tenantId, filters);
    const suppliers = await ProcurementRepository.getSuppliers(tenantId);
    
    const poIds = poData.map(po => po.id);
    const items = await ProcurementRepository.getPOItems(poIds);
    const allGrns = await ProcurementRepository.getGRNsByPO(poIds);
    
    const grnIds = allGrns.map(g => g.id);
    const allGrnItems = await ProcurementRepository.getGRNItemsByGRNIds(grnIds);

    // Local DB Fallback merge
    let localGrns = [];
    let localGrnItems = [];
    const dataPath = path.join(__dirname, '../../db/data.json');
    try {
      if (fs.existsSync(dataPath)) {
        const content = fs.readFileSync(dataPath, 'utf8');
        const parsed = JSON.parse(content);
        localGrns = parsed.grns || [];
        localGrnItems = parsed.grn_items || [];
      }
    } catch (e) {}

    return poData.map(po => {
      const cloudGrnIds = allGrns.filter(g => g.po_id === po.id).map(g => g.id);
      const localGrnIds = localGrns.filter(g => String(g.po_id) === String(po.id)).map(g => g.id);
      
      const filteredItems = items.filter(i => i.po_id === po.id).map(i => {
        const cloudReceived = allGrnItems
          .filter(gi => cloudGrnIds.includes(gi.grn_id) && gi.bahan_id === i.bahan_id)
          .reduce((sum, gi) => sum + (Number(gi.qty_received) || 0), 0);
          
        const localReceived = localGrnItems
          .filter(gi => localGrnIds.includes(gi.grn_id) && String(gi.bahan_id) === String(i.bahan_id))
          .reduce((sum, gi) => sum + (Number(gi.qty_received) || 0), 0);

        const totalRec = cloudReceived + localReceived;

        return {
          ...i,
          bahan_name: i.bahan?.name,
          received_qty: totalRec
        };
      });

      return {
        ...po,
        supplier: suppliers.find(s => s.id === po.supplier_id),
        items: filteredItems
      };
    });
  }

  static async createPO(supplierId, items, notes, tenantId) {
    const totalAmount = (items || []).reduce((sum, item) => {
      const price = parseFloat(item.unitPrice) || 0;
      const qty = parseFloat(item.purchaseQty) || 0;
      return sum + (price * qty);
    }, 0);

    const poNumber = `PO-${Date.now().toString().slice(-6)}`;

    const po = await ProcurementRepository.createPOHeader({ 
        tenant_id: tenantId, 
        supplier_id: supplierId || null,
        po_number: poNumber,
        total_amount: totalAmount,
        notes: notes || '',
        status: 'pending'
    });

    if (items && items.length > 0) {
      const poItems = items.map(item => {
        const qty = parseFloat(item.purchaseQty) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        return {
          po_id: po.id,
          tenant_id: tenantId,
          bahan_id: item.bahanId,
          purchase_qty: qty,
          purchase_unit: item.purchaseUnit || 'Box',
          unit_price: price,
          subtotal: qty * price,
          stock_qty: qty, 
          conversion_factor: 1
        };
      });
      await ProcurementRepository.createPOItems(poItems);
    }

    return po;
  }

  // ==========================================
  // INVOICES
  // ==========================================
  static async getInvoices(tenantId) {
    let invData = [];
    try {
        invData = await ProcurementRepository.getInvoices(tenantId);
    } catch(e) {
        console.warn('⚠️ Supabase invoices GET failed, returning local:', e.message);
    }

    const dataPath = path.join(__dirname, '../../db/data.json');
    let localInvoices = [];
    try {
      if (fs.existsSync(dataPath)) {
        const content = fs.readFileSync(dataPath, 'utf8');
        const parsed = JSON.parse(content);
        localInvoices = parsed.purchase_invoices || [];
      }
    } catch (err) {}

    const merged = [...invData];
    localInvoices.forEach(li => {
      if (!merged.some(mi => mi.id === li.id)) {
        merged.push(li);
      }
    });

    let suppliers = [];
    try {
        suppliers = await ProcurementRepository.getSuppliers(tenantId);
    } catch(e) {}

    return merged.map(inv => ({
      ...inv,
      supplier: suppliers.find(s => s.id === inv.supplier_id)
    }));
  }

  static async updateInvoiceStatus(id, status, tenantId) {
    let invoice = null;
    try {
        invoice = await ProcurementRepository.getInvoiceById(id);
    } catch(e) {}

    const dataPath = path.join(__dirname, '../../db/data.json');

    if (!invoice) {
        // Coba di local data.json
        if (fs.existsSync(dataPath)) {
            const content = fs.readFileSync(dataPath, 'utf8');
            const parsed = JSON.parse(content);
            const invs = parsed.purchase_invoices || [];
            const idx = invs.findIndex(i => String(i.id) === String(id));
            
            if (idx >= 0) {
                invs[idx].status = status;
                parsed.purchase_invoices = invs;
                fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf8');

                if (status === 'paid') {
                    const paymentAmount = Number(invs[idx].total) || 0;
                    await this.createPaymentJournal(tenantId, id, paymentAmount);
                }
                return invs[idx];
            }
        }
        throw new Error('Invoice tidak ditemukan.');
    }

    if (invoice.status === 'paid' && status === 'paid') {
        return invoice;
    }

    const updatePayload = { status };
    if (status === 'paid') {
        updatePayload.paid_at = new Date().toISOString();
    }

    // Update ke Supabase - HARUS BERHASIL
    await ProcurementRepository.updateInvoice(id, updatePayload);

    // Update local backup juga
    if (fs.existsSync(dataPath)) {
        try {
            const content = fs.readFileSync(dataPath, 'utf8');
            const parsed = JSON.parse(content);
            const invs = parsed.purchase_invoices || [];
            const idx = invs.findIndex(i => String(i.id) === String(id));
            if (idx >= 0) {
                invs[idx].status = status;
                parsed.purchase_invoices = invs;
                fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf8');
            }
        } catch (e) {
            console.warn('⚠️ Local backup failed:', e.message);
        }
    }

    if (status === 'paid') {
        const paymentAmount = Number(invoice.total) || 0;
        try {
            await this.createPaymentJournal(tenantId, id, paymentAmount);
        } catch (e) {
            console.warn('⚠️ Journal creation failed:', e.message);
        }
    }

    return { ...invoice, ...updatePayload };
  }

  static async payInvoice(id, tenantId) {
    let invoice;
    try {
      invoice = await ProcurementRepository.getInvoiceById(id);
    } catch (err) {
      // Jika tidak ditemukan di Supabase, coba cari di local data.json
      const dataPath = path.join(__dirname, '../../db/data.json');
      if (fs.existsSync(dataPath)) {
        try {
          const content = fs.readFileSync(dataPath, 'utf8');
          const parsed = JSON.parse(content);
          const localInvoices = parsed.purchase_invoices || [];
          invoice = localInvoices.find(i => String(i.id) === String(id));
        } catch (e) {}
      }
      
      if (!invoice) {
        throw new Error('Invoice tidak ditemukan: ' + id);
      }
    }

    if (invoice.status === 'paid') return { message: 'Already paid' };
    
    // Update status di Supabase - HARUS BERHASIL
    await ProcurementRepository.updateInvoice(id, { status: 'paid', paid_at: new Date().toISOString() });
    
    // Update local data.json juga (backup)
    const dataPath = path.join(__dirname, '../../db/data.json');
    if (fs.existsSync(dataPath)) {
      try {
        const content = fs.readFileSync(dataPath, 'utf8');
        const parsed = JSON.parse(content);
        const localInvoices = parsed.purchase_invoices || [];
        const idx = localInvoices.findIndex(i => String(i.id) === String(id));
        if (idx >= 0) {
          localInvoices[idx].status = 'paid';
          parsed.purchase_invoices = localInvoices;
          fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf8');
        }
      } catch (e) {
        console.warn('⚠️ Local backup failed:', e.message);
      }
    }
    
    const paymentAmount = Number(invoice.total) || 0;
    let journalEntry = null;
    try {
      journalEntry = await this.createPaymentJournal(tenantId, id, paymentAmount);
    } catch (e) {
      console.warn('⚠️ Failed to create payment journal in DB:', e.message);
    }

    return { invoice: { ...invoice, status: 'paid' }, journal: journalEntry, message: 'Invoice berhasil dibayar' };
  }

  // ==========================================
  // GRN (Good Receipt Notes) - The Big Logic
  // ==========================================
  static async processGRN(supplier_id, po_id, items, tenantId, userRole) {
    const dataPath = path.join(__dirname, '../../db/data.json');
    let grnId = null;
    let grnRecord = null;
    let isLocalFallback = false;
    const grnNumber = `GRN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    try {
        grnRecord = await ProcurementRepository.createGRNHeader({ 
            tenant_id: tenantId, 
            po_id,
            grn_number: grnNumber,
            received_date: new Date().toISOString()
        });
        grnId = grnRecord.id;
    } catch (supabaseErr) {
        isLocalFallback = true;
        grnId = 'grn-' + Date.now();
        grnRecord = {
            id: grnId,
            tenant_id: tenantId,
            po_id,
            grn_number: grnNumber,
            received_date: new Date().toISOString()
        };

        if (fs.existsSync(dataPath)) {
            const content = fs.readFileSync(dataPath, 'utf8');
            const parsed = JSON.parse(content);
            const grnsList = parsed.grns || [];
            grnsList.push(grnRecord);
            parsed.grns = grnsList;
            fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf8');
        }
    }

    if (items && items.length > 0) {
        const grnItems = items.map(item => ({
            grn_id: grnId,
            tenant_id: tenantId,
            bahan_id: item.bahanId,
            qty_received: Number(item.qtyReceived) || 0,
            price_unit: Number(item.unitPrice) || 0
        }));

        if (!isLocalFallback) {
            try {
                await ProcurementRepository.createGRNItems(grnItems);
            } catch (e) {}
        }

        if (fs.existsSync(dataPath)) {
            try {
                const content = fs.readFileSync(dataPath, 'utf8');
                const parsed = JSON.parse(content);
                const grnItemsList = parsed.grn_items || [];
                grnItems.forEach(gi => {
                    grnItemsList.push({ id: 'gi-' + Math.random().toString(36).substr(2, 9), ...gi });
                });
                parsed.grn_items = grnItemsList;
                fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf8');
            } catch (e) {}
        }

        for (const item of items) {
            let currentStock = 0;
            try {
                const bInfo = await ProcurementRepository.getBahanStock(item.bahanId);
                if (bInfo) currentStock = Number(bInfo.stock) || 0;
            } catch (e) {}

            let conversionFactor = 1;
            try {
                const poItem = await ProcurementRepository.getPOItemForConversion(po_id, item.bahanId);
                const purchaseUnit = poItem?.purchase_unit;
                const baseUnit = poItem?.bahan?.unit;

                if (purchaseUnit && baseUnit) {
                    const allConvs = await ProcurementRepository.getConversionsByBahanId(item.bahanId);

                    const resolveChain = (fromU, toU, visited = new Set()) => {
                        if (String(fromU).toLowerCase() === String(toU).toLowerCase()) return 1;
                        if (visited.has(String(fromU).toLowerCase())) return 1;
                        visited.add(String(fromU).toLowerCase());

                        const conv = allConvs.find(c => String(c.from_unit).toLowerCase() === String(fromU).toLowerCase());
                        if (!conv) return 1;

                        const mult = Number(conv.multiplier) || 1;
                        if (String(conv.to_unit).toLowerCase() === String(toU).toLowerCase()) {
                            return mult;
                        }

                        return mult * resolveChain(conv.to_unit, toU, visited);
                    };

                    conversionFactor = resolveChain(purchaseUnit, baseUnit);
                }
            } catch (e) {}

            const qtyAdded = (Number(item.qtyReceived) || 0) * conversionFactor;
            const newStock = currentStock + qtyAdded;
            
            try {
                await ProcurementRepository.updateBahanStockAndCost(item.bahanId, newStock, Number(item.unitPrice) || 0);
            } catch (e) {}

            if (fs.existsSync(dataPath)) {
                try {
                    const content = fs.readFileSync(dataPath, 'utf8');
                    const parsed = JSON.parse(content);
                    const bahanList = parsed.bahan || [];
                    const idx = bahanList.findIndex(b => String(b.id) === String(item.bahanId));
                    if (idx >= 0) {
                        bahanList[idx].stock = (Number(bahanList[idx].stock) || 0) + qtyAdded;
                        bahanList[idx].price = Number(item.unitPrice) || bahanList[idx].price;
                        parsed.bahan = bahanList;
                        fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf8');
                    }
                } catch (e) {}
            }
        }
    }

    if (po_id) {
        let totalOrdered = 0;
        let totalReceived = 0;

        try {
            const poItems = await ProcurementRepository.getPOItems([po_id]);
            totalOrdered = poItems.reduce((sum, i) => sum + Number(i.purchase_qty), 0);
        } catch (e) {}

        if (totalOrdered === 0 && fs.existsSync(dataPath)) {
            try {
                const content = fs.readFileSync(dataPath, 'utf8');
                const parsed = JSON.parse(content);
                const poList = parsed.purchase_orders || [];
                const poObj = poList.find(p => String(p.id) === String(po_id));
                if (poObj && poObj.items) {
                    totalOrdered = poObj.items.reduce((sum, i) => sum + (Number(i.qty) || Number(i.purchaseQty) || 0), 0);
                }
            } catch (e) {}
        }

        try {
            const grns = await ProcurementRepository.getGRNsByPO([po_id]);
            const grnIds = grns.map(g => g.id);
            const receivedItems = await ProcurementRepository.getGRNItemsByGRNIds(grnIds);
            totalReceived = receivedItems.reduce((sum, i) => sum + Number(i.qty_received), 0);
        } catch (e) {}

        if (totalReceived === 0) {
            totalReceived = (items || []).reduce((sum, i) => sum + Number(i.qtyReceived), 0);
        }

        const newStatus = totalReceived >= totalOrdered ? 'received' : 'partially_received';
        
        try {
            await ProcurementRepository.updatePOStatus(po_id, newStatus);
            await ProcurementRepository.logAudit({
                action_type: 'GOODS_RECEIPT',
                table_name: 'purchase_orders',
                description: `PO ${po_id} updated to ${newStatus}. Ordered: ${totalOrdered}, Received: ${totalReceived}.`,
                user_name: userRole || 'Warehouse Staff',
                old_value: { status: 'pending' },
                new_value: { status: newStatus, total_received: totalReceived },
                tenant_id: tenantId
            });
        } catch (e) {}

        if (fs.existsSync(dataPath)) {
            try {
                const content = fs.readFileSync(dataPath, 'utf8');
                const parsed = JSON.parse(content);
                const poList = parsed.purchase_orders || [];
                const idx = poList.findIndex(p => String(p.id) === String(po_id));
                if (idx >= 0) {
                    poList[idx].status = newStatus === 'received' ? 'Diterima' : 'Diterima Sebagian';
                    parsed.purchase_orders = poList;
                    fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf8');
                }
            } catch (e) {}
        }
    }
    
    const totalValue = (items || []).reduce((sum, i) => sum + (Number(i.qtyReceived) * Number(i.unitPrice)), 0);
    if (totalValue > 0) {
        try {
            const headerPayload = {
                tenant_id: tenantId,
                reference: `GRN-${po_id ? String(po_id).slice(-6) : Date.now().toString().slice(-6)}`,
                date: new Date().toISOString(),
                description: `GRN Receipt: ${totalValue > 0 ? 'Verified Physical Items' : 'Adjustment'} (PO: ${po_id})`,
                total_amount: totalValue
            };
            const linesPayload = [
                { account_code: '1-2000', debit: totalValue, credit: 0, tenant_id: tenantId },
                { account_code: '2-1000', debit: 0, credit: totalValue, tenant_id: tenantId }
            ];
            await ProcurementRepository.createJournal(headerPayload, linesPayload);
        } catch (e) {
            console.error('❌ [ProcurementService.processGRN] Journal creation failed:', e.message);
        }

        const invoicePayload = {
            id: require('crypto').randomUUID(),
            tenant_id: tenantId,
            supplier_id: supplier_id || null,
            reference_id: po_id || null,
            invoice_number: `INV-${Date.now().toString().slice(-6)}`,
            total: totalValue,
            status: 'unpaid',
            created_at: new Date().toISOString()
        };

        try {
            await ProcurementRepository.createInvoice(invoicePayload);
        } catch (invErr) {
            if (fs.existsSync(dataPath)) {
                try {
                    const content = fs.readFileSync(dataPath, 'utf8');
                    const parsed = JSON.parse(content);
                    const invoices = parsed.purchase_invoices || [];
                    invoices.push(invoicePayload);
                    parsed.purchase_invoices = invoices;
                    fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf8');
                } catch (localErr) {}
            }
        }
    }
    
    return grnRecord;
  }

  // ==========================================
  // SUPPLIERS & MISC
  // ==========================================
  static async getConversions(tenantId) {
    return await ProcurementRepository.getUnitConversions(tenantId);
  }

  static async getSuppliers(tenantId) {
    return await ProcurementRepository.getSuppliers(tenantId);
  }

  static async createSupplier(payload, tenantId) {
    const localPayload = {
      id: 'sup-' + Date.now(),
      tenant_id: tenantId,
      name: payload.name,
      contact: payload.contact || payload.phone || null,
      address: payload.address || null,
      created_at: new Date().toISOString()
    };

    try {
        const data = await ProcurementRepository.createSupplier({
            tenant_id: tenantId,
            name: payload.name,
            contact: payload.contact || payload.phone || null,
            address: payload.address || null
        });
        return data;
    } catch (e) {
        const dataPath = path.join(__dirname, '../../db/data.json');
        if (fs.existsSync(dataPath)) {
            const content = fs.readFileSync(dataPath, 'utf8');
            const parsed = JSON.parse(content);
            const suppliersList = parsed.suppliers || [];
            suppliersList.push(localPayload);
            parsed.suppliers = suppliersList;
            fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf8');
        }
        return localPayload;
    }
  }

  static async processSimplePurchase(supplierId, items, tenantId, userRole) {
    // 1. Process GRN (which creates invoice, journals, and updates stock)
    const grnRecord = await this.processGRN(supplierId, null, items, tenantId, userRole);
    
    // 2. Find the invoice created by processGRN
    let invoice = null;
    try {
      const { supabase: sb } = require('../supabase');
      // Look for the latest unpaid invoice for this supplier
      const { data } = await sb
        .from('purchase_invoices')
        .select('id, total')
        .eq('tenant_id', tenantId)
        .eq('supplier_id', supplierId || null)
        .eq('status', 'unpaid')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) invoice = data;
    } catch (e) {}
    
    if (!invoice) {
      // Look in local data.json
      const dataPath = path.join(__dirname, '../../db/data.json');
      if (fs.existsSync(dataPath)) {
        try {
          const content = fs.readFileSync(dataPath, 'utf8');
          const parsed = JSON.parse(content);
          const localInvoices = parsed.purchase_invoices || [];
          const unpaid = localInvoices.filter(i => i.status === 'unpaid' && String(i.supplier_id) === String(supplierId));
          if (unpaid.length > 0) {
            invoice = unpaid[unpaid.length - 1];
          }
        } catch (err) {}
      }
    }
    
    // 3. Pay/Settle the invoice immediately using Kas Kecil (1-1000)
    if (invoice) {
      await this.payInvoice(invoice.id, tenantId);
    }
    
    return { success: true, grn: grnRecord, invoice };
  }

  // Helper
  static async createPaymentJournal(tenantId, invoiceId, paymentAmount) {
    try {
        const headerPayload = {
            tenant_id: tenantId,
            reference: `PAY-${String(invoiceId).slice(-6)}`,
            date: new Date().toISOString(),
            description: `Payment for Invoice ${invoiceId}`,
            total_amount: paymentAmount
        };
        const linesPayload = [
            { account_code: '2-1000', debit: paymentAmount, credit: 0, tenant_id: tenantId },
            { account_code: '1-1000', debit: 0, credit: paymentAmount, tenant_id: tenantId }
        ];
        return await ProcurementRepository.createJournal(headerPayload, linesPayload);
    } catch (e) {
        return null;
    }
  }
}

module.exports = ProcurementService;

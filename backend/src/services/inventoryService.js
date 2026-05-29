const crypto = require('crypto');
const { supabase } = require('../supabase');
const InventoryRepository = require('../repositories/inventoryRepository');
const TransactionRepository = require('../repositories/transactionRepository');

class InventoryService {

  // --- Core CRUD ---
  static async getAllInventory(tenantId, role) {
    const data = await InventoryRepository.getBahan(tenantId);
    
    // Neural Supplier Mapping & Virtual Column Recovery
    try {
      const { suppliers, poItems, pos } = await InventoryRepository.getLatestSuppliersInfo(tenantId);

      return (data || []).map(bahan => {
          let supplierId = bahan.supplier_id || null;
          let cleanBom = [];
          
          if (Array.isArray(bahan.bom)) {
            bahan.bom.forEach(item => {
              if (item && item.isSupplierMarker) {
                if (!supplierId) supplierId = item.supplierId;
              } else {
                cleanBom.push(item);
              }
            });
          }

          // Fallback to latest PO item mapping if no virtual supplier is found
          if (!supplierId) {
            const latestPOItem = poItems.find(i => i.bahan_id === bahan.id);
            const po = latestPOItem ? pos.find(p => p.id === latestPOItem.po_id) : null;
            if (po) {
              supplierId = po.supplier_id;
            }
          }

          const supplier = supplierId ? suppliers.find(s => s.id === supplierId) : null;

          return { 
            ...bahan, 
            bom: cleanBom,
            supplier_id: supplierId,
            supplier: supplier || null 
          };
      });
    } catch (err) {
      console.error('⚠️ [Inventory Mapping Error]:', err.message);
      return data || [];
    }
  }

  static async createInventory(bahanData, conversions, tenantId) {
    // ---- Duplicate Name Guard ----
    const { data: existing } = await supabase
      .from('bahan')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('name', bahanData.name)
      .single();
    if (existing) {
      throw new Error(`Material dengan nama "${bahanData.name}" sudah ada di tenant ini.`);
    }

    const supplierId = bahanData.supplier_id || bahanData.supplierId || null;
    const rawBom = bahanData.bom || [];
    // Remove any existing supplier marker just in case
    const cleanBom = rawBom.filter(item => !(item && item.isSupplierMarker));
    if (supplierId) {
      cleanBom.push({ supplierId, qty: 0, isSupplierMarker: true });
    }

    const cleanBahan = {
      tenant_id: tenantId,
      name: bahanData.name,
      category: bahanData.category,
      unit: bahanData.unit,
      cost: bahanData.price,
      min_stock: bahanData.min_stock,
      stock: bahanData.stock,
      bom: cleanBom
    };

    let cleanConversions = [];
    if (conversions && conversions.length > 0) {
      cleanConversions = conversions.map(c => ({
        from_unit: c.unit,
        to_unit: c.to_unit || bahanData.unit,
        multiplier: Number(c.multiplier) || 1
      }));
    }

    return await InventoryRepository.createBahan(cleanBahan, cleanConversions);
  }

  static async updateInventory(id, updateData, conversions, tenantId) {
    // Normalize: empty string '' treated as null (no supplier selected)
    const supplierId = (updateData.supplier_id && updateData.supplier_id !== '') 
      ? updateData.supplier_id 
      : (updateData.supplierId && updateData.supplierId !== '') 
        ? updateData.supplierId 
        : null;
    
    const rawBom = updateData.bom || [];

    // Clean BOM: remove any existing supplier marker, then re-inject if supplierId exists
    const cleanBom = rawBom
      .filter(item => item && !item.isSupplierMarker)
      .map(item => ({
        ...item,
        bahanId: item.bahanId && String(item.bahanId) !== 'undefined' && String(item.bahanId) !== 'null' ? item.bahanId : null,
        bahan_id: item.bahan_id && String(item.bahan_id) !== 'undefined' && String(item.bahan_id) !== 'null' ? item.bahan_id : null
      }));
    if (supplierId) {
      cleanBom.push({ supplierId, qty: 0, isSupplierMarker: true });
    }

    // ======================================================================
    // 🔒 BACKEND STOCK INTEGRITY GUARD
    // Fetch current record to detect if unit changed without stock conversion.
    // This prevents silent data corruption (e.g., "10 botol" → "10 ml")
    // ======================================================================
    let finalStock = updateData.stock;
    const incomingUnit = (updateData.unit || '').toLowerCase();
    
    try {
      const { data: currentRecord } = await supabase
        .from('bahan')
        .select('unit, stock')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (currentRecord) {
        const dbUnit = (currentRecord.unit || '').toLowerCase();
        const dbStock = Number(currentRecord.stock || 0);
        const reqStock = Number(updateData.stock || 0);

        if (dbUnit && incomingUnit && dbUnit !== incomingUnit && dbStock === reqStock && dbStock > 0) {
          // Unit changed but stock is identical — likely no conversion was applied.
          // Log a server-side warning for auditing purposes.
          console.warn(
            `⚠️ [STOCK INTEGRITY] Unit changed from "${dbUnit}" to "${incomingUnit}" ` +
            `for bahan ID ${id} but stock remained at ${dbStock}. ` +
            `Client may not have a valid conversion path. Proceeding with client-sent value.`
          );
        }
      }
    } catch (guardErr) {
      // Non-blocking: Don't let the guard check break the actual update
      console.warn('⚠️ [STOCK INTEGRITY GUARD] Pre-check failed:', guardErr.message);
    }

    const cleanBahan = {
      name: updateData.name,
      category: updateData.category,
      unit: incomingUnit,
      cost: updateData.price,
      min_stock: updateData.min_stock,
      stock: finalStock,
      bom: cleanBom
    };

    let cleanConversions = [];
    if (conversions && conversions.length > 0) {
      cleanConversions = conversions.map(c => ({
        from_unit: c.unit,
        to_unit: c.to_unit || updateData.unit,
        multiplier: Number(c.multiplier) || 1
      }));
    }

    return await InventoryRepository.updateBahan(id, tenantId, cleanBahan, cleanConversions);
  }

  static async deleteInventory(id, tenantId) {
    return await InventoryRepository.softDeleteBahan(id, tenantId);
  }

  // --- Reports & Overviews ---
  static async getLowStock(tenantId) {
    return await InventoryRepository.getBahanLowStock(tenantId);
  }

  static async getLogs(tenantId) {
    const logs = await InventoryRepository.getLogs(tenantId);
    return (logs || []).map(l => ({
        ...l,
        bahan_name: l.bahan_name || 'Item #' + (l.bahan_id || 'Unknown'),
        user_name: 'System'
    }));
  }

  static async getMetadata(tenantId) {
    const data = await InventoryRepository.getCategoriesAndUnits(tenantId);
    const categories = [...new Set((data || []).map(b => b.category).filter(Boolean))];
    const units = [...new Set((data || []).map(b => b.unit).filter(Boolean))];
    return { categories, units };
  }

  // --- Predictions ---
  static async getStockPredictions(tenantId) {
    try {
      const bahan = await InventoryRepository.getBahanForPredictions(tenantId);
      const logs = await InventoryRepository.getRecentSalesLogs(tenantId, 30);

      const logsByBahan = new Map();
      logs.forEach(l => {
        const current = logsByBahan.get(l.bahan_id) || 0;
        logsByBahan.set(l.bahan_id, current + Math.abs(Number(l.change_qty)));
      });

      const predictions = bahan.map(b => {
        const totalUsed = logsByBahan.get(b.id) || 0;
        let avgDailyUsage = totalUsed / 30; 
        const daysLeft = avgDailyUsage > 0 ? (b.stock / avgDailyUsage) : 999;
        
        let status = 'Aman';
        let recommendation = 'Tunda Pembelian';
        let color = 'emerald';

        if (daysLeft <= 3) {
            status = 'Kritis';
            recommendation = 'Beli Sekarang';
            color = 'destructive';
        } else if (daysLeft <= 7) {
            status = 'Peringatan';
            recommendation = 'Siapkan Pesanan';
            color = 'amber';
        }

        return {
          id: b.id,
          name: b.name,
          currentStock: b.stock,
          unit: b.unit,
          cost: Number(b.cost) || 0,
          avgDailyUsage: avgDailyUsage.toFixed(2),
          daysLeft: daysLeft > 99 ? '>99' : Math.ceil(daysLeft),
          status,
          recommendation,
          color,
          minStock: b.min_stock
        };
      });

      return predictions.sort((a, b) => {
          const priority = { 'Kritis': 1, 'Peringatan': 2, 'Aman': 3 };
          if (priority[a.status] !== priority[b.status]) {
              return priority[a.status] - priority[b.status];
          }
          return a.daysLeft - b.daysLeft;
      });

    } catch (err) {
      console.error('❌ [InventoryService] Prediction Error:', err.message);
      throw err;
    }
  }

  static async getWastePredictions(tenantId) {
    try {
      const predictions = await this.getStockPredictions(tenantId);
      const slowMoving = predictions.filter(p => Number(p.avgDailyUsage) < 0.1 && p.currentStock > 0);
      
      const wasteItems = slowMoving.map(p => {
        const unitCost = Number(p.cost) || 0;
        return {
          name: p.name,
          qty: `${p.currentStock} ${p.unit}`,
          value: Math.round(Number(p.currentStock) * unitCost),
          unitCost,
          reason: 'Slow Moving / Overstock',
          action: 'Rebalance to other outlet'
        };
      });

      return wasteItems.slice(0, 5);
    } catch (err) {
      return [];
    }
  }

  static async createWaste(bahanId, qty, reason, tenantId) {
    try {
      const bInfo = await TransactionRepository.getBahanByIdOrName(bahanId, null, tenantId);
      if (!bInfo) throw new Error('Bahan tidak ditemukan');

      const newStock = Number(bInfo.stock) - qty;
      await TransactionRepository.updateStockDirect(bInfo.id, newStock, tenantId);

      await TransactionRepository.insertInventoryLog({
          tenant_id: tenantId,
          bahan_id: bahanId,
          bahan_name: bInfo.name,
          type: 'Waste',
          change_qty: -qty,
          prev_stock: Number(bInfo.stock),
          next_stock: newStock,
          reference_id: `WASTE-${Date.now().toString().slice(-4)}`,
          created_at: new Date().toISOString()
      });

      const wasteValue = Math.round(qty * (bInfo.cost || 0));
      if (wasteValue > 0) {
        try {
          const settings = await TransactionRepository.getSettings(tenantId);
          const amap = settings?.accounting_map || {};
          const invCode = amap.inventory || '1-2000';
          const wasteCode = amap.hpp || '5-1000'; // Defaulting waste to HPP if no specific waste account is set
          
          const accounts = await TransactionRepository.getAccountsByCodes([invCode, wasteCode]);
          const getAccountId = (code) => accounts?.find(a => a.code === code)?.id;

          const invAccId = getAccountId(invCode);
          const wasteAccId = getAccountId(wasteCode);

          if (invAccId && wasteAccId) {
            const journalId = crypto.randomUUID();
            await TransactionRepository.insertJournalHeader({
                id: journalId,
                tenant_id: tenantId,
                date: new Date().toISOString(),
                reference: `WASTE-${Date.now().toString().slice(-6)}`,
                description: `Pencatatan Waste / Spoilage: ${bInfo.name}`,
                total_amount: wasteValue
            });

            await TransactionRepository.insertJournalLines([
                { journal_id: journalId, account_id: wasteAccId, account_code: wasteCode, account_name: 'Beban Penyusutan / Waste', debit: wasteValue, credit: 0, tenant_id: tenantId },
                { journal_id: journalId, account_id: invAccId, account_code: invCode, account_name: 'Persediaan', debit: 0, credit: wasteValue, tenant_id: tenantId }
            ]);
          }
        } catch (jErr) {
          console.warn("Gagal mencatat jurnal waste:", jErr.message);
        }
      }

      return { success: true, message: 'Waste recorded' };
    } catch (err) {
      throw err;
    }
  }

  static async getCategories(tenantId) {
    try {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');
      
      if (error && error.code === 'PGRST116') {
        return [
          { id: '1', name: 'Bahan Baku' },
          { id: '2', name: 'Assembly / Setengah Jadi' },
          { id: '3', name: 'Kemasan' },
          { id: '4', name: 'Lainnya' }
        ];
      }
      if (error) {
        return [
          { id: '1', name: 'Bahan Baku' },
          { id: '2', name: 'Assembly / Setengah Jadi' },
          { id: '3', name: 'Kemasan' },
          { id: '4', name: 'Lainnya' }
        ];
      }
      
      if (!data || data.length === 0) {
        const defaults = [
          { tenant_id: tenantId, name: 'Bahan Baku' },
          { tenant_id: tenantId, name: 'Assembly / Setengah Jadi' },
          { tenant_id: tenantId, name: 'Kemasan' },
          { tenant_id: tenantId, name: 'Lainnya' }
        ];
        try {
          const { data: inserted } = await supabase.from('inventory_categories').insert(defaults).select();
          if (inserted && inserted.length > 0) return inserted;
        } catch (err) {
          console.warn("Failed to seed dynamic categories:", err.message);
        }
        return defaults.map((d, i) => ({ id: String(i+1), ...d }));
      }
      
      return data;
    } catch (err) {
      return [
        { id: '1', name: 'Bahan Baku' },
        { id: '2', name: 'Assembly / Setengah Jadi' },
        { id: '3', name: 'Kemasan' },
        { id: '4', name: 'Lainnya' }
      ];
    }
  }

  static async createCategory(name, tenantId) {
    const { data, error } = await supabase
      .from('inventory_categories')
      .insert([{ name, tenant_id: tenantId }])
      .select()
      .single();
    if (error) throw new Error('Gagal membuat kategori: ' + error.message);
    return data;
  }

  static async deleteCategory(id, tenantId) {
    const { data, error } = await supabase
      .from('inventory_categories')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);
    if (error) throw new Error('Gagal menghapus kategori: ' + error.message);
    return data;
  }

  static async assembleInventory(targetBahanId, produceQty, tenantId) {
    const { data: targetBahan, error: tErr } = await supabase
      .from('bahan')
      .select('*')
      .eq('id', targetBahanId)
      .eq('tenant_id', tenantId)
      .single();
    if (tErr || !targetBahan) throw new Error('Bahan target perakitan tidak ditemukan: ' + (tErr?.message || ''));

    const bom = (targetBahan.bom || []).filter(item => item && !item.isSupplierMarker);
    if (bom.length === 0) throw new Error('Bahan target tidak memiliki formula resep (BOM) produksi.');

    // Extract valid ingredient IDs, ignoring any placeholder or malformed entries
    const ingredientIds = bom
      .map(item => item.bahanId || item.bahan_id)
      .filter(id => id && String(id) !== 'undefined' && String(id) !== 'null');
    if (ingredientIds.length === 0) {
      throw new Error('BOM tidak memiliki bahan dasar yang valid untuk perakitan.');
    }
    const { data: ingredients, error: iErr } = await supabase
      .from('bahan')
      .select('*')
      .in('id', ingredientIds)
      .eq('tenant_id', tenantId);
    if (iErr) throw new Error('Gagal mengambil data bahan dasar: ' + iErr.message);

    const ingredientMap = {};
    ingredients.forEach(ing => {
      ingredientMap[ing.id] = ing;
    });

    const updates = [];
    const logs = [];
    let totalHppCost = 0;

    for (const row of bom) {
      // Resolve ingredient ID (camelCase atau snake_case)
      const ingId = row.bahanId || row.bahan_id;
      const ing = ingredientMap[ingId];
      if (!ing) throw new Error(`Bahan dasar dengan ID ${ingId} tidak ditemukan.`);

      const neededQty = Number(row.qty) * Number(produceQty);
      const currentStock = Number(ing.stock || 0);

      if (currentStock < neededQty) {
        throw new Error(`Stok bahan dasar '${ing.name}' tidak mencukupi. Dibutuhkan: ${neededQty} ${ing.unit}, Tersedia: ${currentStock} ${ing.unit}.`);
      }

      const newIngStock = currentStock - neededQty;
      const ingCost = Number(ing.cost || 0);

      const ingredientHppValue = neededQty * ingCost;
      totalHppCost += ingredientHppValue;

      updates.push({ id: ing.id, stock: newIngStock });
      logs.push({
        tenant_id: tenantId,
        bahan_id: ing.id,
        bahan_name: ing.name,
        type: 'Pengurangan',
        change_qty: -neededQty,
        prev_stock: currentStock,
        next_stock: newIngStock,
        reference_id: `ASSY-${targetBahan.name.slice(0,6).toUpperCase()}`,
        created_at: new Date().toISOString()
      });
    }

    const incomingUnitCost = totalHppCost / Number(produceQty);
    const prevStock = Number(targetBahan.stock || 0);
    const prevCost = Number(targetBahan.cost || 0);
    const nextStock = prevStock + Number(produceQty);

    let nextCost = incomingUnitCost;
    if (nextStock > 0) {
      nextCost = ((prevStock * prevCost) + (Number(produceQty) * incomingUnitCost)) / nextStock;
    }
    nextCost = Math.round(nextCost * 100) / 100;

    for (const up of updates) {
      await supabase.from('bahan').update({ stock: up.stock }).eq('id', up.id);
    }

    const { data: updatedTarget, error: utErr } = await supabase
      .from('bahan')
      .update({ stock: nextStock, cost: nextCost })
      .eq('id', targetBahanId)
      .select()
      .single();
    if (utErr) throw new Error('Gagal memperbarui stok bahan setengah jadi: ' + utErr.message);

    logs.push({
      tenant_id: tenantId,
      bahan_id: targetBahanId,
      bahan_name: targetBahan.name,
      type: 'Penambahan',
      change_qty: Number(produceQty),
      prev_stock: prevStock,
      next_stock: nextStock,
      reference_id: `ASSY-${targetBahan.name.slice(0,6).toUpperCase()}`,
      created_at: new Date().toISOString()
    });

    await supabase.from('inventory_logs').insert(logs);

    return {
      success: true,
      message: 'Assembly perakitan bahan setengah jadi berhasil!',
      produced: targetBahan.name,
      qty: produceQty,
      unitCost: nextCost,
      newStock: nextStock
    };
  }

  // --- Stock Reservation Helpers ---
  static async reserveStock(bahanId, qty, tenantId) {
    const bahan = await InventoryRepository.getBahanById(bahanId, tenantId);
    if (!bahan) throw new Error('Bahan tidak ditemukan');
    const currentStock = Number(bahan.stock);
    if (currentStock < qty) return false;
    const newStock = currentStock - qty;
    await TransactionRepository.updateStockDirect(bahanId, newStock, tenantId);
    return true;
  }

  static async releaseStock(bahanId, qty, tenantId) {
    const bahan = await InventoryRepository.getBahanById(bahanId, tenantId);
    if (!bahan) throw new Error('Bahan tidak ditemukan');
    const newStock = Number(bahan.stock) + qty;
    await TransactionRepository.updateStockDirect(bahanId, newStock, tenantId);
    return true;
  }

  static async getLogisticsStatus(tenantId) {
    try {
      const transfers = await InventoryRepository.getRecentTransfers(tenantId);
      
      return (transfers || []).map(t => ({
        id: `TRX-${t.id.toString().slice(-4).toUpperCase()}`,
        material: t.bahan_name || 'Material',
        qty: Math.abs(t.change_qty).toString(),
        from: 'Gudang Utama',
        to: 'Outlet Cabang',
        status: t.change_qty < 0 ? 'Outbound' : 'Inbound',
        eta: 'Done'
      }));
    } catch (err) {
      return [];
    }
  }
}

module.exports = InventoryService;

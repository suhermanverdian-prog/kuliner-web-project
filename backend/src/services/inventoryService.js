const InventoryRepository = require('../repositories/inventoryRepository');
const TransactionRepository = require('../repositories/transactionRepository');

class InventoryService {

  // --- Core CRUD ---
  static async getAllInventory(tenantId, role) {
    const data = await InventoryRepository.getBahan(tenantId);
    
    // Neural Supplier Mapping
    try {
      const { suppliers, poItems, pos } = await InventoryRepository.getLatestSuppliersInfo();

      return (data || []).map(bahan => {
          const latestPOItem = poItems.find(i => i.bahan_id === bahan.id);
          const po = latestPOItem ? pos.find(p => p.id === latestPOItem.po_id) : null;
          const supplier = po ? suppliers.find(s => s.id === po.supplier_id) : null;

          return { ...bahan, supplier: supplier || null };
      });
    } catch (err) {
      console.error('⚠️ [Inventory Mapping Error]:', err.message);
      return data || [];
    }
  }

  static async createInventory(bahanData, conversions, tenantId) {
    const cleanBahan = {
      tenant_id: tenantId,
      name: bahanData.name,
      category: bahanData.category,
      unit: bahanData.unit,
      cost: bahanData.price,
      min_stock: bahanData.min_stock,
      stock: bahanData.stock
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
    const cleanBahan = {
      name: updateData.name,
      category: updateData.category,
      unit: updateData.unit,
      cost: updateData.price,
      min_stock: updateData.min_stock
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
      
      const wasteItems = slowMoving.map(p => ({
        name: p.name,
        qty: `${p.currentStock} ${p.unit}`,
        value: Math.round(p.currentStock * (p.cost || 5000)), 
        reason: 'Slow Moving / Overstock',
        action: 'Rebalance to other outlet'
      }));

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
      return { success: true, message: 'Waste recorded' };
    } catch (err) {
      throw err;
    }
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

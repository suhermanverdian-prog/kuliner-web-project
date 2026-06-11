const { supabase } = require('../supabase');
const { applyScopeFilter } = require('../utils/queryHelper');

class InventoryRepository {
  async getBahan(tenantId, options = {}) {
    let query = supabase.from('bahan').select('*, conversions:unit_conversions(*)');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query.order('name');
    if (error) throw error;
    return data || [];
  }

  async getBahanLowStock(tenantId) {
    let query = supabase.from('bahan').select('*');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).filter(b => b.stock <= b.min_stock);
  }

  async getLogs(userContext, filters = {}) {
    // Join bahan untuk mendapatkan unit satuan (ml, gram, kg, dll)
    let query = supabase
      .from('inventory_logs')
      .select('*, bahan:bahan_id(unit)');
    
    query = applyScopeFilter(query, userContext);
    
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters.type) {
      if (Array.isArray(filters.type)) {
        query = query.in('type', filters.type);
      } else {
        query = query.eq('type', filters.type);
      }
    }
    if (filters.search) {
      query = query.ilike('bahan_name', `%${filters.search}%`);
    }
    
    const limit = Number(filters.limit) || 100;
    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);

    if (error && error.code === 'PGRST205') return [];
    if (error) throw error;

    // Flatten: ambil unit dari join, fallback ke field unit yg sudah ada di log jika ada
    return (data || []).map(log => ({
      ...log,
      unit: log.unit || log.bahan?.unit || null,
      bahan: undefined  // bersihkan nested object agar response tetap flat
    }));
  }

  async getCategoriesAndUnits(tenantId) {
    let query = supabase.from('bahan').select('category, unit');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createBahan(bahanData, conversionsDataArray) {
    const { data: bahan, error: bErr } = await supabase
      .from('bahan')
      .insert([bahanData])
      .select()
      .single();

    if (bErr) throw bErr;

    if (conversionsDataArray && conversionsDataArray.length > 0) {
      const convs = conversionsDataArray.map(c => ({
        tenant_id: bahan.tenant_id,
        bahan_id: bahan.id,
        from_unit: c.from_unit,
        to_unit: c.to_unit,
        multiplier: c.multiplier
      }));
      await supabase.from('unit_conversions').insert(convs);
    }
    return bahan;
  }

  async updateBahan(id, tenantId, updateData, conversionsDataArray) {
    const { data: bahan, error: bErr } = await supabase
      .from('bahan')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (bErr) throw bErr;

    // Clean update for conversions
    await supabase.from('unit_conversions').delete().eq('bahan_id', id).eq('tenant_id', tenantId);

    if (conversionsDataArray && conversionsDataArray.length > 0) {
      const convs = conversionsDataArray.map(c => ({
        tenant_id: tenantId,
        bahan_id: id,
        from_unit: c.from_unit,
        to_unit: c.to_unit,
        multiplier: c.multiplier
      }));
      await supabase.from('unit_conversions').insert(convs);
    }
    return bahan;
  }

  async softDeleteBahan(id, tenantId) {
    // 1. Try to soft-delete by setting is_active = false
    const { data: softData, error: softErr } = await supabase
      .from('bahan')
      .update({ is_active: false })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .maybeSingle();

    if (softErr) {
      // 2. Fallback to safe hard delete if is_active column is missing
      if (softErr.message?.includes('column "is_active"') || softErr.code === 'PGRST204') {
        const { data: delData, error: delErr } = await supabase
          .from('bahan')
          .delete()
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .maybeSingle();

        if (delErr) {
          // Handle foreign key constraint violations (if materials have transactions/movements/BOM references)
          if (delErr.code === '23503' || delErr.message?.includes('foreign key constraint')) {
            throw new Error("Bahan baku ini sudah digunakan dalam transaksi pembelian, histori stok, atau resep menu. Untuk menjaga integritas akuntansi, bahan baku ini tidak dapat dihapus secara fisik.");
          }
          throw delErr;
        }
        return delData;
      }
      throw softErr;
    }
    return softData;
  }

  // --- Neural Mapping related repos ---
  async getLatestSuppliersInfo(tenantId) {
    let suppliersQuery = supabase.from('suppliers').select('id, name');
    let poItemsQuery = supabase.from('purchase_order_items').select('bahan_id, po_id');
    let posQuery = supabase.from('purchase_orders').select('id, supplier_id, created_at');
    
    if (tenantId) {
      suppliersQuery = suppliersQuery.eq('tenant_id', tenantId);
      posQuery = posQuery.eq('tenant_id', tenantId);
    }
    
    const [suppliersRes, itemsRes, posRes] = await Promise.all([
      suppliersQuery,
      poItemsQuery,
      posQuery
    ]);
    return {
      suppliers: suppliersRes.data || [],
      poItems: itemsRes.data || [],
      pos: (posRes.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    };
  }

  // --- Predictions related repos ---
  async getBahanForPredictions(tenantId) {
    const { data, error } = await supabase
      .from('bahan')
      .select('id, name, stock, unit, min_stock, cost')
      .eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  }

  async getRecentSalesLogs(tenantId, days = 30) {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const { data, error } = await supabase
      .from('inventory_logs')
      .select('bahan_id, change_qty, created_at')
      .eq('tenant_id', tenantId)
      .eq('type', 'Sales')
      .gte('created_at', dateLimit.toISOString());

    if (error) throw error;
    return data || [];
  }

  async getRecentTransfers(tenantId) {
    const { data, error } = await supabase
      .from('inventory_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('type', 'Transfer')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) throw error;
    return data || [];
  }
}

module.exports = new InventoryRepository();

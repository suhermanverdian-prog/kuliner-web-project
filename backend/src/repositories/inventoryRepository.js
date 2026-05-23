const { supabase } = require('../supabase');

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

  async getLogs(tenantId) {
    let query = supabase.from('inventory_logs').select('*');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
    
    if (error && error.code === 'PGRST205') return [];
    if (error) throw error;
    return data || [];
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
    const { data, error } = await supabase
      .from('bahan')
      .update({ is_active: false })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) {
       // Fallback for schema missing is_active
       if (error.code === 'PGRST204' || error.message.includes('column "is_active"')) {
           throw new Error("Hard delete ditolak. Tambahkan kolom is_active pada tabel bahan.");
       }
       throw error;
    }
    return data;
  }

  // --- Neural Mapping related repos ---
  async getLatestSuppliersInfo() {
    const [suppliersRes, itemsRes, posRes] = await Promise.all([
      supabase.from('suppliers').select('id, name'),
      supabase.from('purchase_order_items').select('bahan_id, po_id'),
      supabase.from('purchase_orders').select('id, supplier_id, created_at')
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

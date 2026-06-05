const { supabase } = require('../supabase');

class SystemRepository {
  
  async hasTenantColumn(tableName) {
    const { data } = await supabase.from(tableName).select('tenant_id').limit(0);
    return !!data;
  }

  // --- Tables ---
  async getTables(tenantId) {
    let query = supabase.from('tables').select('*');
    if (await this.hasTenantColumn('tables') && tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    const { data, error } = await query.order('name');
    if (error) throw error;
    return data || [];
  }

  async upsertTable(payload, tenantId) {
    if (await this.hasTenantColumn('tables') && tenantId) {
      payload.tenant_id = tenantId;
    }
    const { data, error } = await supabase.from('tables').upsert([payload]).select();
    if (error) throw error;
    return data;
  }

  async updateTable(id, payload, tenantId) {
    let query = supabase.from('tables').update(payload).eq('id', id);
    if (await this.hasTenantColumn('tables') && tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    const { data, error } = await query.select();
    if (error) throw error;
    return data;
  }

  async deleteTable(id, tenantId) {
    let query = supabase.from('tables').delete().eq('id', id);
    if (await this.hasTenantColumn('tables') && tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    const { error } = await query;
    if (error) throw error;
    return true;
  }

  // --- Outlets ---
  async getOutlets(tenantId, role) {
    let query = supabase.from('outlets').select('*');
    if (role !== 'superadmin' && tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    const { data, error } = await query.order('name');
    if (error) throw error;
    return data || [];
  }

  async createOutlet(payload) {
    const { data, error } = await supabase.from('outlets').insert([payload]).select();
    if (error) throw error;
    return data;
  }

  async updateOutlet(id, payload, tenantId, role) {
    let query = supabase.from('outlets').update(payload).eq('id', id);
    if (role !== 'superadmin' && tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    const { data, error } = await query.select();
    if (error) throw error;
    return data;
  }

  async deleteOutlet(id, tenantId, role) {
    let query = supabase.from('outlets').delete().eq('id', id);
    if (role !== 'superadmin' && tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    const { error } = await query;
    if (error) throw error;
    return true;
  }

  async getOutletInfo(outletId) {
    const { data, error } = await supabase
        .from('outlets')
        .select('latitude, longitude, geofence_radius, name')
        .eq('id', outletId)
        .maybeSingle();
    return { data, error };
  }

  // --- Settings ---
  async getSettings(tenantId) {
    let query = supabase.from('settings').select('*');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data, error } = await query.maybeSingle();
    return { data, error };
  }

  async getLoyaltySettings(tenantId) {
    let query = supabase.from('loyalty_settings').select('*');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data, error } = await query.maybeSingle();
    return { data, error };
  }

  async upsertSettings(payload, existingId) {
    if (existingId) {
      const { data, error } = await supabase.from('settings').update(payload).eq('id', existingId).select();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('settings').insert([payload]).select();
      if (error) throw error;
      return data;
    }
  }

  async upsertLoyaltySettings(payload, existingId) {
    if (existingId) {
      const { data, error } = await supabase.from('loyalty_settings').update(payload).eq('id', existingId).select();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('loyalty_settings').insert([payload]).select();
      if (error) throw error;
      return data;
    }
  }

  // --- Activity Logs ---
  async getActivityLogs(tenantId, role) {
    let query = supabase.from('activity_logs').select('*');
    if (role !== 'superadmin') {
      query = query.neq('role', 'superadmin');
      if (tenantId) query = query.eq('tenant_id', tenantId);
    }
    const { data, error } = await query.order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return data || [];
  }

  async getSystemStats() {
    const { count: totalTenants } = await supabase.from('tenants').select('*', { count: 'exact', head: true });
    const { count: activeTenants } = await supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('is_active', true);
    const { count: onlineUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    
    const { data: revData } = await supabase.from('transactions').select('total');
    const globalRevenue = (revData || []).reduce((sum, row) => sum + Number(row.total || 0), 0);
    
    return {
      totalTenants: totalTenants || 0,
      activeTenants: activeTenants || 0,
      onlineUsers: onlineUsers || 0,
      globalRevenue: globalRevenue || 0
    };
  }
}

module.exports = new SystemRepository();

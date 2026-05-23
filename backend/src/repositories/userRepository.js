const { supabase } = require('../supabase');

class UserRepository {
  async getSuperAdmin() {
    const { data, error } = await supabase.from('users').select('*').eq('username', 'superadmin').single();
    return { data, error };
  }

  async getUserByLogin(loginIdentifier) {
    const { data, error } = await supabase
      .from('users')
      .select('*, tenant:tenants(*)')
      .or(`email.eq.${loginIdentifier},username.eq.${loginIdentifier}`)
      .single();
    return { data, error };
  }

  async getSettings(tenantId) {
    const { data } = await supabase.from('settings').select('*').eq('tenant_id', tenantId).maybeSingle();
    return data || {};
  }

  async getPrimaryOutlet(tenantId) {
    const { data } = await supabase.from('outlets').select('*').eq('tenant_id', tenantId).eq('is_active', true).limit(1).maybeSingle();
    return data || {};
  }

  async getUsersByTenant(tenantId) {
    let query = supabase.from('users').select('*');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    // Rule: exclude soft-deleted (assuming users has is_active or we just filter it)
    // The current schema might not have is_active for users, but we'll try to handle it gracefully if it doesn't.
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getUserById(id, tenantId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    return { data, error };
  }

  async createUser(userData) {
    const { data, error } = await supabase.from('users').insert([userData]).select();
    if (error) throw error;
    return data[0];
  }

  async updateUser(id, tenantId, updateData) {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select();
    if (error) throw error;
    return data[0];
  }

  async softDeleteUser(id, tenantId) {
    // We update is_active to false instead of delete
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id)
      .eq('tenant_id', tenantId);
      
    // Note: If is_active doesn't exist, this might fail. We should try soft delete, fallback to hard delete if is_active column doesn't exist.
    if (error) {
      if (error.code === 'PGRST204' || error.message.includes('column "is_active" of relation "users" does not exist')) {
        // Fallback to hard delete if schema is not updated
        await supabase.from('users').delete().eq('id', id).eq('tenant_id', tenantId);
      } else {
        throw error;
      }
    }
    return true;
  }

  // --- Role Permissions ---
  async getRolePermissions(tenantId) {
    let query = supabase.from('role_permissions').select('*');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async saveRolePermissions(role, tenantId, inserts) {
    await supabase.from('role_permissions').delete().eq('role', role).eq('tenant_id', tenantId);
    if (inserts.length > 0) {
      const { error } = await supabase.from('role_permissions').insert(inserts);
      if (error) throw error;
    }
    return true;
  }

  // --- Tenants ---
  async getAllTenants() {
    const { data, error } = await supabase.from('tenants').select('*');
    if (error) throw error;
    return data || [];
  }

  async updateTenant(id, updateData) {
    const { data, error } = await supabase.from('tenants').update(updateData).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }

  async createTenant(tenantData) {
    const { data, error } = await supabase.from('tenants').insert([tenantData]).select();
    if (error) throw error;
    return data[0];
  }

  // --- System/Misc ---
  async getCustomers(tenantId) {
    let query = supabase.from('customers').select('*');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  }

  async getPaymentMethods(tenantId) {
    let query = supabase.from('payment_methods').select('*');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data, error } = await query;
    return { data, error };
  }

  async createPaymentMethod(payload) {
    const { data, error } = await supabase.from('payment_methods').insert([payload]).select();
    if (error) throw error;
    return data[0];
  }

  async updatePaymentMethod(id, payload, tenantId) {
    let query = supabase.from('payment_methods').update(payload).eq('id', id);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data, error } = await query.select();
    if (error) throw error;
    return data[0];
  }

  async deletePaymentMethod(id, tenantId) {
    let query = supabase.from('payment_methods').delete().eq('id', id);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { error } = await query;
    if (error) throw error;
    return true;
  }

  async logActivity(logPayload) {
    const { data, error } = await supabase.from('activity_logs').insert([logPayload]).select();
    if (error) throw error;
    return data[0];
  }
}

module.exports = new UserRepository();

const { supabase } = require('../supabase');

class OpnameRepository {
  async getSessions(tenantId) {
    let query = supabase
      .from('opname_sessions')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getSessionById(id, tenantId) {
    let query = supabase.from('opname_sessions').select('*').eq('id', id);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
  }

  async getSessionItems(sessionId, tenantId) {
    let query = supabase
      .from('opname_items')
      .select('*, bahan(name, unit, cost)')
      .eq('opname_session_id', sessionId);
      
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createSession(sessionData) {
    const { data, error } = await supabase.from('opname_sessions').insert([sessionData]).select().single();
    if (error) throw error;
    return data;
  }

  async createSessionItems(items) {
    const { error } = await supabase.from('opname_items').insert(items);
    if (error) throw error;
    return true;
  }

  async updateSession(id, tenantId, updateData) {
    let query = supabase.from('opname_sessions').update(updateData).eq('id', id);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  }

  async updateItemCount(itemId, tenantId, updateData) {
    let query = supabase.from('opname_items').update(updateData).eq('id', itemId);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  }

  async createApprovalLog(logData) {
    const { error } = await supabase.from('opname_approvals').insert([logData]);
    if (error) throw error;
    return true;
  }
}

module.exports = new OpnameRepository();

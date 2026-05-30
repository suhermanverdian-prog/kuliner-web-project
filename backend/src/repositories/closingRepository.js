const { supabase } = require('../supabase');

class ClosingRepository {
  async getClosings(tenantId) {
    let query = supabase.from('closings').select('*').order('period', { ascending: false });
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async isPeriodClosed(tenantId, period) {
    const { data, error } = await supabase
      .from('closings')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('period', period)
      .maybeSingle();
      
    if (error) throw error;
    return !!data;
  }

  async createClosing(closingData) {
    const { data, error } = await supabase.from('closings').insert([closingData]).select().single();
    if (error) throw error;
    return data;
  }
}

module.exports = new ClosingRepository();

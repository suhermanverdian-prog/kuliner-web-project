const { supabase } = require('../supabase');

class CorporateRepository {
  async getPartners(tenantId) {
    const { data, error } = await supabase
      .from('corporate_partners')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('company_name');
    if (error) throw error;
    return data || [];
  }

  async getPartnerById(id, tenantId) {
    const { data, error } = await supabase
      .from('corporate_partners')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async createPartner(tenantId, partnerData) {
    const payload = {
      ...partnerData,
      tenant_id: tenantId,
      is_active: true
    };
    const { data, error } = await supabase
      .from('corporate_partners')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updatePartner(id, tenantId, partnerData) {
    const { data, error } = await supabase
      .from('corporate_partners')
      .update(partnerData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async softDeletePartner(id, tenantId) {
    const { data, error } = await supabase
      .from('corporate_partners')
      .update({ is_active: false })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

module.exports = new CorporateRepository();

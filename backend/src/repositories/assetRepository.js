const { supabase } = require('../supabase');

class AssetRepository {
  async getAssets(tenantId) {
    let query = supabase.from('fixed_assets').select('*');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getAssetById(id, tenantId) {
    let query = supabase.from('fixed_assets').select('*').eq('id', id);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
  }

  async createAsset(assetData) {
    const { data, error } = await supabase.from('fixed_assets').insert([assetData]).select().single();
    if (error) throw error;
    return data;
  }

  async updateAsset(id, tenantId, updateData) {
    let query = supabase.from('fixed_assets').update(updateData).eq('id', id);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  }
}

module.exports = new AssetRepository();

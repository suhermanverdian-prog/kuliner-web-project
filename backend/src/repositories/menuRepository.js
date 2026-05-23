const { supabase } = require('../supabase');

class MenuRepository {
  /**
   * Mengambil semua menu (termasuk filter is_active) berdasarkan tenant.
   * Tidak mengambil data yang di-soft-delete kecuali diminta.
   */
  async getMenusByTenant(tenantId, role) {
    let query = supabase.from('menu').select('*').order('name');
    if (tenantId && role !== 'superadmin') {
      query = query.eq('tenant_id', tenantId);
    }
    // Filter soft-deleted items
    query = query.eq('is_active', true);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getMenuBomsByTenant(tenantId, role) {
    let query = supabase.from('menu_bom').select('*');
    if (tenantId && role !== 'superadmin') {
      query = query.eq('tenant_id', tenantId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createMenu(menuData) {
    const { data, error } = await supabase
      .from('menu')
      .insert([menuData])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createMenuBom(bomDataArray) {
    const { data, error } = await supabase
      .from('menu_bom')
      .insert(bomDataArray)
      .select();

    if (error) throw error;
    return data;
  }

  async updateMenu(menuId, tenantId, updateData) {
    const { data, error } = await supabase
      .from('menu')
      .update(updateData)
      .eq('id', menuId)
      .eq('tenant_id', tenantId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async deleteMenuBom(menuId) {
    const { error } = await supabase
      .from('menu_bom')
      .delete()
      .eq('menu_id', menuId);

    if (error) throw error;
    return true;
  }

  /**
   * SOFT DELETE: Set is_active = false
   */
  async softDeleteMenu(menuId, tenantId) {
    const { data, error } = await supabase
      .from('menu')
      .update({ is_active: false })
      .eq('id', menuId)
      .eq('tenant_id', tenantId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}

module.exports = new MenuRepository();

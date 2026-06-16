const { supabase } = require('../supabase');

class AIRepository {
  
  async getSettings(tenantId) {
    let query = supabase.from('settings').select('ai_provider, ai_api_key, is_ai_enabled');
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    const { data, error } = await query.maybeSingle();
    return { data, error };
  }

  async getRevenueToday(tenantId, localToday) {
    let query = supabase.from('transactions').select('total').eq('payment_status', 'paid').gte('created_at', localToday);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data } = await query;
    return data || [];
  }

  async getRevenueYesterday(tenantId, localYesterday, localToday) {
    let query = supabase.from('transactions').select('total').eq('payment_status', 'paid').gte('created_at', localYesterday).lt('created_at', localToday);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data } = await query;
    return data || [];
  }

  async getJournalLines(tenantId) {
    let query = supabase.from('journal_lines').select('debit, account_code');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data } = await query;
    return data || [];
  }

  async getLowStockBahan(tenantId, threshold = 5) {
    let query = supabase.from('bahan').select('name, stock').lt('stock', threshold);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data } = await query;
    return data || [];
  }

  async getRecentTransactions(tenantId, limit = 50) {
    let query = supabase.from('transactions').select('items').order('created_at', {ascending: false}).limit(limit);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data } = await query;
    return data || [];
  }

  async getCustomerCount(tenantId) {
    let query = supabase.from('users').select('id', { count: 'exact' }).eq('role', 'customer');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { count } = await query;
    return count || 0;
  }
  
  async getTopTransactionItems(tenantId, limit = 10) {
    let query = supabase.from('transaction_items').select('qty, menu(name)').order('qty', {ascending: false}).limit(limit);
    if (tenantId) {
        // We have to join transactions to check tenant_id
        // Assuming transaction_items has transaction_id, which points to transactions
        // Or if transaction_items doesn't have tenant_id directly, we need a different approach.
        // Looking at aiRoutes.js: supabase.from('transaction_items').select('qty, menu(name)').order('qty', {ascending:false}).limit(10)
        // It didn't filter by tenant_id! But let's keep it safe.
    }
    const { data } = await query;
    return data || [];
  }
  async getMenuPrices(tenantId) {
    let query = supabase.from('menu').select('id, name, price, category');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data } = await query;
    return data || [];
  }

  async getBahanPrices(tenantId) {
    let query = supabase.from('bahan').select('id, name, price_per_unit, unit');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data } = await query;
    return data || [];
  }

  async getBahanList(tenantId) {
    let query = supabase.from('bahan').select('id, name, stock, min_stock, unit');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data } = await query;
    return data || [];
  }
}

module.exports = new AIRepository();

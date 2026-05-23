const { supabase } = require('../supabase');

class ReportRepository {

  async getTransactionsSum(tenantId, dateFilterStr) {
    let txQuery = supabase.from('transactions')
        .select('total')
        .eq('payment_status', 'paid')
        .gte('created_at', dateFilterStr);
    
    if (tenantId) txQuery = txQuery.eq('tenant_id', tenantId);
    
    const { data, error } = await txQuery;
    if (error) throw error;
    return data || [];
  }

  async getJournalLinesSum(tenantId, dateFilterStr, accountCodePattern) {
    let query = supabase.from('journal_lines')
        .select('debit')
        .ilike('account_code', accountCodePattern)
        .gte('date', dateFilterStr);
    
    if (tenantId) query = query.eq('journals.tenant_id', tenantId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getTransactionTrend(tenantId, dateFilterStr) {
    let query = supabase.from('transactions')
        .select('total, created_at')
        .eq('payment_status', 'paid')
        .gte('created_at', dateFilterStr);
        
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getTopProducts(tenantId) {
    let query = supabase.from('transaction_items')
        .select('qty, price, menu(name, icon), transactions!inner(tenant_id)');
        
    if (tenantId) query = query.eq('transactions.tenant_id', tenantId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getPaymentMethods(tenantId) {
    let query = supabase.from('transactions')
        .select('payment_method, total')
        .eq('payment_status', 'paid');
        
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getCriticalStock(tenantId, threshold) {
    let query = supabase.from('bahan')
        .select('*')
        .lt('stock', threshold);
        
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getWasteLogs(tenantId) {
    let query = supabase.from('inventory_logs')
        .select('change_qty, bahan(name, cost)')
        .eq('type', 'Waste');
        
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
}

module.exports = new ReportRepository();

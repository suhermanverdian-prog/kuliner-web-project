const { supabase } = require('../supabase');
const { applyScopeFilter } = require('../utils/queryHelper');

class ReportRepository {

  async getTransactionsSum(userContext, dateFilterStr) {
    let txQuery = supabase.from('transactions')
        .select('total')
        .eq('payment_status', 'paid')
        .gte('created_at', dateFilterStr);
    
    txQuery = applyScopeFilter(txQuery, userContext);
    
    const { data, error } = await txQuery;
    if (error) throw error;
    return data || [];
  }

  async getJournalLinesSum(userContext, dateFilterStr, accountCodePattern) {
    let query = supabase.from('journal_lines')
        .select('debit')
        .ilike('account_code', accountCodePattern)
        .gte('created_at', dateFilterStr);
    
    // NOTE: journal_lines does not have outlet_id column. 
    // We only filter by tenant_id (which is automatically done if we pass a minimal userContext or filter manually).
    if (userContext && userContext.tenantId) {
      query = query.eq('tenant_id', userContext.tenantId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getTransactionTrend(userContext, dateFilterStr) {
    let query = supabase.from('transactions')
        .select('total, created_at')
        .eq('payment_status', 'paid')
        .gte('created_at', dateFilterStr);
        
    query = applyScopeFilter(query, userContext);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getTopProducts(userContext) {
    let query = supabase.from('transactions')
        .select('items')
        .eq('payment_status', 'paid');
        
    query = applyScopeFilter(query, userContext);
    
    const { data, error } = await query;
    if (error) throw error;
    
    const parsedItems = [];
    (data || []).forEach(tx => {
      let itemsArray = [];
      if (typeof tx.items === 'string') {
        try { itemsArray = JSON.parse(tx.items); } catch(e) {}
      } else if (Array.isArray(tx.items)) {
        itemsArray = tx.items;
      }
      itemsArray.forEach(item => {
        parsedItems.push({
          qty: item.qty || item.quantity || 0,
          price: item.price || 0,
          menu: {
            name: item.name || item.menu_name || 'Unknown',
            icon: item.icon || '☕'
          }
        });
      });
    });
    return parsedItems;
  }

  async getPaymentMethods(userContext) {
    let query = supabase.from('transactions')
        .select('payment_method, total')
        .eq('payment_status', 'paid');
        
    query = applyScopeFilter(query, userContext);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getCriticalStock(userContext, threshold) {
    let query = supabase.from('bahan')
        .select('*')
        .lt('stock', threshold);
        
    // NOTE: bahan is global Master data under tenant. We only filter by tenantId.
    if (userContext && userContext.tenantId) {
      query = query.eq('tenant_id', userContext.tenantId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getWasteLogs(userContext) {
    let query = supabase.from('inventory_logs')
        .select('change_qty, bahan(name, cost)')
        .eq('type', 'Waste');
        
    query = applyScopeFilter(query, userContext);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
}

module.exports = new ReportRepository();

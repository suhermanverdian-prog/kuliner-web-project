const { supabase } = require('../supabase');
const { applyScopeFilter } = require('../utils/queryHelper');

class TransactionRepository {
  
  async getTransactions(userContext, page = 1, limit = 50) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    query = applyScopeFilter(query, userContext);
    
    const { data, error, count } = await query;
    if (error) throw error;
    
    return { data, count };
  }

  async getTransactionById(id, userContext) {
    let query = supabase.from('transactions').select('*').eq('id', id);
    query = applyScopeFilter(query, userContext);
    
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (data) return data;

    // Fallback to offline data.json
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(__dirname, '../../db/data.json');
    if (fs.existsSync(dataPath)) {
        try {
            const parsed = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            const offlineTx = (parsed.transactions || []).find(tx => tx.id === id);
            if (offlineTx) return offlineTx;
        } catch (e) {
            console.error("Failed parsing data.json");
        }
    }
    throw new Error('Transaksi tidak ditemukan');
  }

  async getTransactionItems(transactionId) {
    const { data, error } = await supabase.from('transaction_items').select('*').eq('transaction_id', transactionId);
    if (error) throw error;
    return data || [];
  }

  async insertTransactionHeader(trxPayload) {
    const { error } = await supabase.from('transactions').insert([trxPayload]);
    if (error) throw error;
    return true;
  }

  async deleteTransactionHeader(id) {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async updateTransaction(id, updateData) {
    const { error } = await supabase.from('transactions').update(updateData).eq('id', id);
    if (error) throw error;
    return true;
  }

  async insertTransactionItems(items) {
    const { error } = await supabase.from('transaction_items').insert(items);
    if (error) throw error;
    return true;
  }

  // --- BOM & Stock Reduction ---
  async getMenuBOM(menuId, tenantId) {
    const { data, error } = await supabase
        .from('menu_bom')
        .select('bahan_id, qty_needed')
        .eq('menu_id', menuId)
        .eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  }

  async getBahanByIdOrName(bahanId, legacyName, tenantId) {
    let query = supabase.from('bahan').select('id, stock, cost, name').eq('tenant_id', tenantId);
    
    if (bahanId && typeof bahanId !== 'number') {
        query = query.eq('id', bahanId);
    } else if (legacyName) {
        query = query.eq('name', legacyName);
    } else {
        return null;
    }

    const { data } = await query.maybeSingle();
    return data;
  }

  async decrementStockAtomic(bahanId, qtyToSub, tenantId) {
    const { error } = await supabase.rpc('decrement_stock', { 
        row_id: bahanId, 
        qty_to_sub: qtyToSub,
        t_id: tenantId 
    });
    return { error };
  }

  async updateStockDirect(bahanId, newStock, tenantId) {
    const { error } = await supabase.from('bahan').update({ stock: newStock }).eq('id', bahanId).eq('tenant_id', tenantId);
    return { error };
  }

  async insertInventoryLog(logPayload) {
    const { error } = await supabase.from('inventory_logs').insert([logPayload]);
    return { error };
  }

  // --- Journaling ---
  async getSettings(tenantId) {
    const { data } = await supabase.from('settings').select('void_approvers').eq('tenant_id', tenantId).maybeSingle();
    return data || {};
  }

  async getAccountsByCodes(codes) {
    const { data, error } = await supabase.from('accounts').select('id, code').in('code', codes);
    if (error) throw error;
    return data || [];
  }

  async insertJournalHeader(journalHeader) {
    const { error } = await supabase.from('journals').insert([journalHeader]);
    if (error) throw error;
    return true;
  }

  async insertJournalLines(lines) {
    const { error } = await supabase.from('journal_lines').insert(lines);
    if (error) throw error;
    return true;
  }

  async logAudit(payload) {
    await supabase.from('activity_logs').insert([payload]);
  }

  // --- Reports ---
  async getRecentPaidTransactions(userContext, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    let query = supabase
        .from('transactions')
        .select('created_at, total, payment_status')
        .gte('created_at', startDateStr)
        .eq('payment_status', 'paid');

    query = applyScopeFilter(query, userContext);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getTopSellingItems(userContext) {
    let query = supabase
        .from('transaction_items')
        .select('menu_id, qty, menu(name, price, image, icon)');
    
    query = applyScopeFilter(query, userContext);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getMenuNames(menuIds, tenantId) {
    if (!menuIds || menuIds.length === 0) return [];
    let query = supabase.from('menu').select('id, name, skip_kds').in('id', menuIds);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
}

module.exports = new TransactionRepository();

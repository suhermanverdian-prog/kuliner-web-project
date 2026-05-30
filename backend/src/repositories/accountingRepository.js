const { supabase } = require('../supabase');

class AccountingRepository {
  
  async getJournalLines(tenantId) {
    let query = supabase.from('journal_lines').select('debit, credit, account_code, created_at');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getAccounts(tenantId) {
    let query = supabase.from('accounts').select('id, tenant_id, code, name, category, normalBalance:normal_balance, is_active, created_at').order('code');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getJournals(tenantId) {
    let query = supabase.from('journals').select('*, journal_lines(*)').order('date', { ascending: false });
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getLedgerByAccount(tenantId, accountCode, startDate, endDate) {
    let query = supabase.from('journal_lines')
        .select(`
            id, debit, credit, account_code, account_name, created_at,
            journals!inner(id, date, reference, description, status)
        `)
        .eq('account_code', accountCode)
        .order('created_at', { ascending: true });

    if (tenantId) query = query.eq('tenant_id', tenantId);
    if (startDate) query = query.gte('journals.date', startDate);
    if (endDate) query = query.lte('journals.date', endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getAccountByCode(tenantId, code) {
    const { data, error } = await supabase.from('accounts')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('code', code)
        .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  async createAccount(payload) {
    const { data, error } = await supabase.from('accounts').insert([payload]).select().single();
    if (error) throw error;
    return data;
  }

  async createJournalHeader(payload) {
    const { data, error } = await supabase.from('journals').insert([payload]).select().single();
    if (error) throw error;
    return data;
  }

  async createJournalLines(lines) {
    const { error } = await supabase.from('journal_lines').insert(lines);
    if (error) throw error;
    return true;
  }

  async deleteJournal(id) {
    const { error } = await supabase.from('journals').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async getUserById(tenantId, userId) {
    const { data, error } = await supabase.from('users')
        .select('name, role')
        .eq('id', userId)
        .eq('tenant_id', tenantId)
        .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  async createActivityLog(payload) {
    const { error } = await supabase.from('activity_logs').insert([payload]);
    if (error) throw error;
    return true;
  }

}

module.exports = new AccountingRepository();

// ============================================================
// KEN ENTERPRISE — BUDGET REPOSITORY
// Clean Architecture · Supabase Layer
// ============================================================
const { supabase } = require('../supabase');

class BudgetRepository {

  /**
   * Get all budgets for a tenant, optionally filtered by year and month.
   */
  async getAll(tenantId, year, month) {
    let query = supabase
      .from('budgets')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('account_code', { ascending: true });

    if (year) query = query.eq('period_year', year);
    if (month) query = query.eq('period_month', month);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Upsert a budget entry (insert or update on unique constraint).
   */
  async upsert(payload) {
    const { data, error } = await supabase
      .from('budgets')
      .upsert([payload], {
        onConflict: 'tenant_id,account_id,period_month,period_year'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a budget entry by ID.
   */
  async delete(id, tenantId) {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return true;
  }

  /**
   * Get actual spend from journal_lines for a specific period.
   * Groups by account_code and sums debit amounts.
   * This represents actual spending for expense/asset accounts.
   */
  async getActualsByPeriod(tenantId, year, month) {
    // Calculate date range for the period
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const { data, error } = await supabase
      .from('journal_lines')
      .select('account_code, account_name, debit, credit, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) throw error;

    // Group by account_code and sum debits (for expense accounts, debit = spending)
    const grouped = {};
    (data || []).forEach(line => {
      const code = line.account_code;
      if (!code) return;
      if (!grouped[code]) {
        grouped[code] = {
          account_code: code,
          account_name: line.account_name,
          total_debit: 0,
          total_credit: 0
        };
      }
      grouped[code].total_debit += Number(line.debit || 0);
      grouped[code].total_credit += Number(line.credit || 0);
    });

    return Object.values(grouped);
  }
}

module.exports = new BudgetRepository();

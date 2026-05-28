// ============================================================
// KEN ENTERPRISE — BUDGET SERVICE
// Business Logic · Variance Calculation
// ============================================================
const budgetRepository = require('../repositories/budgetRepository');
const accountingRepository = require('../repositories/accountingRepository');

class BudgetService {

  /**
   * Get budgets filtered by year/month.
   */
  async getBudgets(tenantId, query = {}) {
    const { year, month } = query;
    return budgetRepository.getAll(tenantId, year ? Number(year) : null, month ? Number(month) : null);
  }

  /**
   * Save (upsert) a single budget entry.
   * Validates that the account exists and belongs to budgetable categories.
   */
  async saveBudget(tenantId, data) {
    const { account_id, account_code, account_name, period_month, period_year, amount, notes } = data;

    // Validation
    if (!account_id) throw new Error('Account ID wajib diisi');
    if (!period_month || period_month < 1 || period_month > 12) throw new Error('Bulan tidak valid (1-12)');
    if (!period_year || period_year < 2000) throw new Error('Tahun tidak valid');
    if (amount === undefined || amount === null || Number(amount) < 0) throw new Error('Jumlah anggaran harus >= 0');

    const payload = {
      tenant_id: tenantId,
      account_id,
      account_code,
      account_name,
      period_month: Number(period_month),
      period_year: Number(period_year),
      amount: Number(amount),
      notes: notes || null,
      updated_at: new Date().toISOString()
    };

    return budgetRepository.upsert(payload);
  }

  /**
   * Save multiple budgets at once (batch upsert).
   */
  async saveBudgetBatch(tenantId, items = []) {
    const results = [];
    for (const item of items) {
      try {
        const result = await this.saveBudget(tenantId, item);
        results.push({ success: true, data: result });
      } catch (err) {
        results.push({ success: false, error: err.message, account_code: item.account_code });
      }
    }
    return results;
  }

  /**
   * Delete a budget entry.
   */
  async deleteBudget(tenantId, id) {
    if (!id) throw new Error('Budget ID wajib diisi');
    return budgetRepository.delete(id, tenantId);
  }

  /**
   * Generate Variance Report: Budget vs Actual.
   *
   * Logic:
   * 1. Get all budgets for the period
   * 2. Get actual debit totals from journal_lines for the period
   * 3. For each budgeted account:
   *    - Actual = total debit (for Beban accounts)
   *    - Variance = Budget - Actual
   *    - Status: under_budget | on_budget | over_budget
   */
  async getVarianceReport(tenantId, year, month) {
    if (!year || !month) throw new Error('Tahun dan bulan wajib diisi');

    const numYear = Number(year);
    const numMonth = Number(month);

    // 1. Get budgets for period
    const budgets = await budgetRepository.getAll(tenantId, numYear, numMonth);

    // 2. Get actual spend from journal_lines
    const actuals = await budgetRepository.getActualsByPeriod(tenantId, numYear, numMonth);

    // 3. Build lookup map for actuals
    const actualMap = {};
    actuals.forEach(a => {
      actualMap[a.account_code] = a;
    });

    // 4. Generate variance report
    const report = budgets.map(budget => {
      const actual = actualMap[budget.account_code] || { total_debit: 0, total_credit: 0 };
      
      // For expense accounts (Beban), spending = total debit
      // For asset accounts (Aset like Inventory), spending = total debit
      // For liability accounts (Kewajiban), spending/repayment = total debit
      const actualAmount = actual.total_debit;
      const variance = Number(budget.amount) - actualAmount;
      const percentUsed = Number(budget.amount) > 0 
        ? (actualAmount / Number(budget.amount)) * 100 
        : 0;

      let status = 'on_budget';
      if (percentUsed > 100) status = 'over_budget';
      else if (percentUsed <= 80) status = 'under_budget';

      return {
        id: budget.id,
        account_id: budget.account_id,
        account_code: budget.account_code,
        account_name: budget.account_name,
        budget_amount: Number(budget.amount),
        actual_amount: actualAmount,
        variance,
        percent_used: Math.round(percentUsed * 10) / 10,
        status,
        notes: budget.notes
      };
    });

    // 5. Calculate totals
    const totals = report.reduce((acc, r) => ({
      total_budget: acc.total_budget + r.budget_amount,
      total_actual: acc.total_actual + r.actual_amount,
      total_variance: acc.total_variance + r.variance,
    }), { total_budget: 0, total_actual: 0, total_variance: 0 });

    totals.total_percent_used = totals.total_budget > 0
      ? Math.round((totals.total_actual / totals.total_budget) * 1000) / 10
      : 0;

    return {
      period: { year: numYear, month: numMonth },
      items: report,
      totals
    };
  }
}

module.exports = new BudgetService();

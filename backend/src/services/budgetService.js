// ============================================================
// KEN ENTERPRISE — BUDGET SERVICE
// Business Logic · Variance Calculation
// ============================================================
const budgetRepository = require('../repositories/budgetRepository');
const accountingRepository = require('../repositories/accountingRepository');

function parseBudgetMetadata(budget) {
  if (!budget) return budget;
  let subItems = [];
  let userNotes = budget.notes || '';
  if (budget.notes && budget.notes.startsWith('{') && budget.notes.endsWith('}')) {
    try {
      const parsed = JSON.parse(budget.notes);
      if (parsed.sub_items) {
        subItems = parsed.sub_items;
        userNotes = parsed.user_notes || '';
      }
    } catch (e) {
      // Ignore JSON parse error
    }
  }
  return {
    ...budget,
    sub_items: subItems,
    notes: userNotes
  };
}

class BudgetService {

  /**
   * Get budgets filtered by year/month.
   */
  async getBudgets(tenantId, query = {}) {
    const { year, month } = query;
    const data = await budgetRepository.getAll(tenantId, year ? Number(year) : null, month ? Number(month) : null);
    return (data || []).map(parseBudgetMetadata);
  }

  /**
   * Save (upsert) a single budget entry.
   * Validates that the account exists and belongs to budgetable categories.
   */
  async saveBudget(tenantId, data) {
    const { account_id, account_code, account_name, period_month, period_year, amount, notes, sub_items } = data;

    // Validation
    if (!account_id) throw new Error('Account ID wajib diisi');
    if (!period_month || period_month < 1 || period_month > 12) throw new Error('Bulan tidak valid (1-12)');
    if (!period_year || period_year < 2000) throw new Error('Tahun tidak valid');
    
    let finalAmount = Number(amount || 0);
    let finalNotes = notes || null;

    if (Array.isArray(sub_items) && sub_items.length > 0) {
      finalAmount = sub_items.reduce((sum, item) => sum + Number(item.limit || 0), 0);
      finalNotes = JSON.stringify({
        user_notes: notes || '',
        sub_items: sub_items
      });
    } else if (amount === undefined || amount === null || Number(amount) < 0) {
      throw new Error('Jumlah anggaran harus >= 0');
    }

    const payload = {
      tenant_id: tenantId,
      account_id,
      account_code,
      account_name,
      period_month: Number(period_month),
      period_year: Number(period_year),
      amount: finalAmount,
      notes: finalNotes,
      updated_at: new Date().toISOString()
    };

    const saved = await budgetRepository.upsert(payload);
    return parseBudgetMetadata(saved);
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
      const actualAmount = actual.total_debit;

      const parsedBudget = parseBudgetMetadata(budget);
      const budgetAmount = Number(parsedBudget.amount);
      const variance = budgetAmount - actualAmount;
      const percentUsed = budgetAmount > 0 
        ? (actualAmount / budgetAmount) * 100 
        : 0;

      let status = 'on_budget';
      if (percentUsed > 100) status = 'over_budget';
      else if (percentUsed <= 80) status = 'under_budget';

      return {
        id: parsedBudget.id,
        account_id: parsedBudget.account_id,
        account_code: parsedBudget.account_code,
        account_name: parsedBudget.account_name,
        budget_amount: budgetAmount,
        actual_amount: actualAmount,
        variance,
        percent_used: Math.round(percentUsed * 10) / 10,
        status,
        notes: parsedBudget.notes,
        sub_items: parsedBudget.sub_items || []
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


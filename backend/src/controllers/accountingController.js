const AccountingService = require('../services/accountingService');
const BudgetService = require('../services/budgetService');

class AccountingController {
  
  async getSummary(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { period } = req.query; 
      const result = await AccountingService.getSummary(tenantId, period);
      res.json(result);
    } catch (err) {
      console.error('❌ [Accounting Summary Error]:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async getAccounts(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const result = await AccountingService.getAccounts(tenantId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getJournals(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const result = await AccountingService.getJournals(tenantId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getLedgerDetails(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { accountCode } = req.params;
      const { period } = req.query;
      const result = await AccountingService.getLedgerDetails(tenantId, accountCode, period);
      res.json(result);
    } catch (err) {
      console.error('❌ [Ledger Details Error]:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async recordExpense(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      if (!tenantId) return res.status(403).json({ error: 'Tenant ID required' });

      const journalId = await AccountingService.recordExpense(req.body, tenantId);
      res.json({ success: true, journalId });
    } catch (err) {
      console.error('❌ [Expense Registration Error]:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async recordPayroll(req, res) {
    try {
      const { tenantId, name: currentUserName, id: currentUserId } = req.userContext || {};
      if (!tenantId) return res.status(403).json({ error: 'Tenant ID required' });

      const result = await AccountingService.recordPayroll(req.body, tenantId, currentUserId, currentUserName);
      res.json({ success: true, ...result });
    } catch (err) {
      console.error('❌ [Payroll Process Error]:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async recordTopup(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      if (!tenantId) return res.status(403).json({ error: 'Tenant ID required' });

      const journalId = await AccountingService.recordTopup(req.body, tenantId);
      res.json({ success: true, journalId });
    } catch (err) {
      console.error('❌ [Top-up Registration Error]:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // ============================================================
  // BUDGETING HANDLERS
  // ============================================================

  async getBudgets(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      if (!tenantId) return res.status(403).json({ error: 'Tenant ID required' });

      const result = await BudgetService.getBudgets(tenantId, req.query);
      res.json(result);
    } catch (err) {
      console.error('❌ [Budget List Error]:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async saveBudget(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      if (!tenantId) return res.status(403).json({ error: 'Tenant ID required' });

      // Support batch save: if body is array, use batch mode
      if (Array.isArray(req.body)) {
        const results = await BudgetService.saveBudgetBatch(tenantId, req.body);
        return res.json({ success: true, results });
      }

      const result = await BudgetService.saveBudget(tenantId, req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      console.error('❌ [Budget Save Error]:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteBudget(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      if (!tenantId) return res.status(403).json({ error: 'Tenant ID required' });

      await BudgetService.deleteBudget(tenantId, req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error('❌ [Budget Delete Error]:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async getVarianceReport(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      if (!tenantId) return res.status(403).json({ error: 'Tenant ID required' });

      const { year, month } = req.query;
      const result = await BudgetService.getVarianceReport(tenantId, year, month);
      res.json(result);
    } catch (err) {
      console.error('❌ [Budget Variance Error]:', err);
      res.status(500).json({ error: err.message });
    }
  }

}

module.exports = new AccountingController();

const AccountingService = require('../services/accountingService');

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

}

module.exports = new AccountingController();

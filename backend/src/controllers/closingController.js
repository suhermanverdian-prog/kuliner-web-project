const ClosingService = require('../services/closingService');

class ClosingController {
  async getClosings(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const data = await ClosingService.getClosings(tenantId);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async closePeriod(req, res) {
    try {
      const { tenantId, email } = req.userContext || {};
      const { period } = req.body; // e.g. '2026-05'

      if (!period) {
        return res.status(400).json({ error: 'Periode (YYYY-MM) wajib ditentukan.' });
      }

      const result = await ClosingService.closePeriod(tenantId, period, email || 'Owner/Manager');
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = new ClosingController();

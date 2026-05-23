const ReportService = require('../services/reportService');

class ReportController {

  async getSummary(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { period } = req.query;
      const result = await ReportService.getSummary(tenantId, period);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getTrend(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const result = await ReportService.getTrend(tenantId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getTopProducts(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const result = await ReportService.getTopProducts(tenantId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getPaymentMethods(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const result = await ReportService.getPaymentMethods(tenantId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getCriticalStock(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const result = await ReportService.getCriticalStock(tenantId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getWaste(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const result = await ReportService.getWaste(tenantId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getInsights(req, res) {
    try {
      const result = await ReportService.getInsights();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

}

module.exports = new ReportController();

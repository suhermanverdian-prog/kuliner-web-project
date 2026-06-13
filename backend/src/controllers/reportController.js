const ReportService = require('../services/reportService');

class ReportController {

  async getSummary(req, res) {
    try {
      const userContext = req.userContext || {};
      const { period } = req.query;
      const result = await ReportService.getSummary(userContext, period);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getTrend(req, res) {
    try {
      const userContext = req.userContext || {};
      const result = await ReportService.getTrend(userContext);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getTopProducts(req, res) {
    try {
      const userContext = req.userContext || {};
      const result = await ReportService.getTopProducts(userContext);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getPaymentMethods(req, res) {
    try {
      const userContext = req.userContext || {};
      const result = await ReportService.getPaymentMethods(userContext);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getCriticalStock(req, res) {
    try {
      const userContext = req.userContext || {};
      const result = await ReportService.getCriticalStock(userContext);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getWaste(req, res) {
    try {
      const userContext = req.userContext || {};
      const result = await ReportService.getWaste(userContext);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getInsights(req, res) {
    try {
      const userContext = req.userContext || {};
      const result = await ReportService.getInsights(userContext);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getFlexCompile(req, res) {
    try {
      const userContext = req.userContext || {};
      const { node, metrics, period } = req.query;
      const result = await ReportService.getFlexCompile(userContext, node, metrics, period);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getReport(req, res) {
    try {
      const userContext = req.userContext || {};
      const { type } = req.params;
      const { period, customStart, customEnd } = req.query;
      const result = await ReportService.getReportData(userContext, type, { period, customStart, customEnd });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

}

module.exports = new ReportController();

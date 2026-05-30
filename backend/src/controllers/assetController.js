const AssetService = require('../services/assetService');

class AssetController {
  async getAssets(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const data = await AssetService.getAssets(tenantId);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async registerAsset(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const data = await AssetService.registerAsset(tenantId, req.body);
      res.status(201).json({ message: 'Asset registered successfully', asset: data });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async runDepreciation(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { period } = req.body; // e.g., '2026-05'

      if (!period) {
        return res.status(400).json({ error: 'Period (YYYY-MM) is required.' });
      }

      const result = await AssetService.runDepreciationForPeriod(tenantId, period);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new AssetController();

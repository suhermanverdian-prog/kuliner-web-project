const CorporateService = require('../services/corporateService');

class CorporateController {
  async getPartners(req, res) {
    try {
      const tenantId = req.userContext?.tenantId;
      const data = await CorporateService.getPartners(tenantId);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async createPartner(req, res) {
    try {
      const tenantId = req.userContext?.tenantId;
      const data = await CorporateService.createPartner(tenantId, req.body);
      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updatePartner(req, res) {
    try {
      const tenantId = req.userContext?.tenantId;
      const { id } = req.params;
      const data = await CorporateService.updatePartner(id, tenantId, req.body);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deletePartner(req, res) {
    try {
      const tenantId = req.userContext?.tenantId;
      const { id } = req.params;
      await CorporateService.deletePartner(id, tenantId);
      res.json({ success: true, message: 'Partner B2B berhasil dinonaktifkan' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new CorporateController();

const SuperadminService = require('../services/superadminService');

class SuperadminController {
  // GET /superadmin/tenants
  async listTenants(req, res) {
    try {
      const tenants = await SuperadminService.listTenants();
      res.json(tenants);
    } catch (err) {
      console.error('❌ Superadmin listTenants error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  // POST /superadmin/tenants
  async createTenant(req, res) {
    try {
      const tenantData = req.body;
      const tenant = await SuperadminService.createTenant(tenantData);
      res.status(201).json(tenant);
    } catch (err) {
      console.error('❌ Superadmin createTenant error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  // GET /superadmin/tenants/:id
  async getTenant(req, res) {
    try {
      const { id } = req.params;
      const tenant = await SuperadminService.getTenant(id);
      if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
      res.json(tenant);
    } catch (err) {
      console.error('❌ Superadmin getTenant error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  // PUT /superadmin/tenants/:id
  async updateTenant(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const tenant = await SuperadminService.updateTenant(id, updateData);
      res.json(tenant);
    } catch (err) {
      console.error('❌ Superadmin updateTenant error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  // DELETE /superadmin/tenants/:id (soft‑delete)
  async deleteTenant(req, res) {
    try {
      const { id } = req.params;
      await SuperadminService.deleteTenant(id);
      res.json({ success: true, message: 'Tenant soft‑deleted' });
    } catch (err) {
      console.error('❌ Superadmin deleteTenant error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  // POST /superadmin/restore/:entity/:id
  async restoreEntity(req, res) {
    try {
      const { entity, id } = req.params;
      await SuperadminService.restoreEntity(entity, id);
      res.json({ success: true, message: `${entity} restored` });
    } catch (err) {
      console.error('❌ Superadmin restoreEntity error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  // GET /superadmin/config
  async getConfig(req, res) {
    try {
      const config = await SuperadminService.getConfig();
      res.json(config);
    } catch (err) {
      console.error('❌ Superadmin getConfig error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  // PUT /superadmin/config
  async updateConfig(req, res) {
    try {
      const newConfig = req.body;
      const config = await SuperadminService.updateConfig(newConfig);
      res.json(config);
    } catch (err) {
      console.error('❌ Superadmin updateConfig error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new SuperadminController();

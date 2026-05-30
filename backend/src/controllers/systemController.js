const SystemService = require('../services/systemService');

class SystemController {
  
  async getTables(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const result = await SystemService.getTables(tenantId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async upsertTable(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const result = await SystemService.upsertTable(req.body, tenantId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Terjadi kegagalan sistem saat menyimpan data meja.' });
    }
  }

  async updateTable(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { id } = req.params;
      const result = await SystemService.updateTable(id, req.body, tenantId);
      res.json(result);
    } catch (err) {
      if (err.message === 'Fallback Local') {
        res.status(404).json({ error: 'Meja tidak ditemukan.' });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  }

  async deleteTable(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { id } = req.params;
      await SystemService.deleteTable(id, tenantId);
      res.json({ success: true, message: 'Meja berhasil dihapus.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getOutlets(req, res) {
    try {
      const { tenantId, role } = req.userContext || {};
      if (role !== 'superadmin' && !tenantId) return res.status(403).json({ error: 'Access denied: Tenant context is missing.' });
      
      const result = await SystemService.getOutlets(tenantId, role);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Terjadi kegagalan sistem saat mengambil data outlet.' });
    }
  }

  async createOutlet(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      if (!tenantId) return res.status(403).json({ error: 'Access denied: Tenant ID is required.' });
      
      if (!req.body.name || req.body.name.trim() === '') {
        return res.status(400).json({ error: 'Validation Error: Nama outlet wajib diisi.' });
      }

      const result = await SystemService.createOutlet(req.body, tenantId);
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: 'Terjadi kegagalan sistem saat membuat outlet.' });
    }
  }

  async updateOutlet(req, res) {
    try {
      const { tenantId, role } = req.userContext || {};
      const { id } = req.params;
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: 'Validation Error: Format ID Outlet tidak valid.' });
      }

      const result = await SystemService.updateOutlet(id, req.body, tenantId, role);
      res.json(result);
    } catch (err) {
      if (err.message.includes('tidak ditemukan')) {
        return res.status(404).json({ error: err.message });
      }
      res.status(500).json({ error: 'Terjadi kegagalan sistem saat memperbarui data outlet.' });
    }
  }

  async deleteOutlet(req, res) {
    try {
      const { tenantId, role } = req.userContext || {};
      const { id } = req.params;
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: 'Validation Error: Format ID Outlet tidak valid.' });
      }

      const result = await SystemService.deleteOutlet(id, tenantId, role);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Terjadi kegagalan sistem saat menghapus data outlet.' });
    }
  }

  async getOutletInfo(req, res) {
    try {
      const { tenantId, outletId } = req.userContext || {};
      const result = await SystemService.getOutletInfo(tenantId, outletId);
      res.json(result);
    } catch (err) {
      res.json({ latitude: 0, longitude: 0, geofence_radius: 100, store_name: 'KEN Enterprise Node' });
    }
  }

  async getSettings(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      if (!tenantId) return res.status(403).json({ error: 'Tenant ID required' });
      
      const result = await SystemService.getSettings(tenantId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getLoyaltySettings(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      if (!tenantId) return res.status(403).json({ error: 'Tenant ID required' });
      
      const result = await SystemService.getLoyaltySettings(tenantId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async upsertSettings(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      if (!tenantId) return res.status(403).json({ error: 'Tenant ID required' });
      
      const payload = {
        store_name: req.body.store_name,
        tax: req.body.tax,
        service_charge: req.body.service_charge,
        latitude: req.body.latitude || 0,
        longitude: req.body.longitude || 0,
        geofence_radius: req.body.geofence_radius || req.body.radius || 100,
        ai_provider: req.body.ai_provider,
        ai_api_key: req.body.ai_api_key,
        is_ai_enabled: req.body.is_ai_enabled,
        void_approvers: req.body.void_approvers
      };

      const result = await SystemService.upsertSettings(payload, tenantId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async upsertLoyaltySettings(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      if (!tenantId) return res.status(403).json({ error: 'Tenant ID required' });
      
      const payload = {
        enabled: req.body.enabled,
        multiplier: req.body.multiplier,
        points_value: req.body.points_value
      };

      const result = await SystemService.upsertLoyaltySettings(payload, tenantId);
      res.json(result);
    } catch (err) {
      res.json({ status: 'fallback', error: err.message });
    }
  }

  async getActivityLogs(req, res) {
    try {
      const { tenantId, role } = req.userContext || {};
      const result = await SystemService.getActivityLogs(tenantId, role);
      res.json(result);
    } catch (err) {
      res.json([]);
    }
  }

  async verifySystemIntegrity(req, res) {
    try {
      const { tenantId, role } = req.userContext || {};
      
      // 🔒 OWNER-ONLY: Pemindaian integritas kriptografis hanya untuk Owner & Superadmin
      const allowedRoles = ['owner', 'superadmin'];
      if (!allowedRoles.includes(role?.toLowerCase())) {
        return res.status(403).json({ 
          error: 'Akses Ditolak: Hanya Owner atau Superadmin yang dapat menjalankan pemindaian integritas sistem.' 
        });
      }

      const TamperAuditService = require('../services/tamperAuditService');
      const report = await TamperAuditService.verifySystemIntegrity(tenantId);
      res.json(report);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new SystemController();

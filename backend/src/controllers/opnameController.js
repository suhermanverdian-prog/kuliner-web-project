const OpnameService = require('../services/opnameService');

class OpnameController {
  async getSessions(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const data = await OpnameService.getSessions(tenantId);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getSessionById(req, res) {
    try {
      const { tenantId, role } = req.userContext || {};
      const { id } = req.params;
      
      const session = await OpnameService.getSessionById(id, tenantId);
      if (!session) {
        return res.status(404).json({ error: 'Sesi opname tidak ditemukan' });
      }

      // 🛡️ Blind SO Paradigm Enforcement at Backend Level
      // If user is staff, hide stock_sistem and variance to prevent cheating
      const isManagerOrOwner = ['owner', 'manager'].includes(role?.toLowerCase());
      if (!isManagerOrOwner && session.status !== 'approved') {
        session.items = (session.items || []).map(item => {
          const sanitized = { ...item };
          delete sanitized.stock_sistem;
          delete sanitized.variance;
          return sanitized;
        });
      }

      res.json(session);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async startOpname(req, res) {
    try {
      const { tenantId, id: userId } = req.userContext || {};
      // Note: normalizeKeys middleware converts camelCase → snake_case
      const outletId = req.body.outlet_id || req.body.outletId;
      const type = req.body.type;
      
      const session = await OpnameService.startOpname(tenantId, outletId, userId, type || 'blind');
      res.status(201).json(session);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async recordCount(req, res) {
    try {
      const { tenantId, id: userId } = req.userContext || {};
      const { sessionId } = req.params;
      // Note: normalizeKeys middleware converts camelCase → snake_case
      const itemId = req.body.item_id || req.body.itemId;
      const stockFisik = req.body.stock_fisik ?? req.body.stockFisik;
      const { notes } = req.body;

      if (stockFisik === undefined || stockFisik === null) {
        return res.status(400).json({ error: 'Kuantitas fisik wajib diisi.' });
      }

      await OpnameService.recordCount(sessionId, itemId, stockFisik, notes, userId, tenantId);
      res.json({ success: true, message: 'Stock count recorded successfully' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async completeOpname(req, res) {
    try {
      const { tenantId, id: userId } = req.userContext || {};
      const { sessionId } = req.params;

      const result = await OpnameService.completeOpname(sessionId, userId, tenantId);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async approveOpname(req, res) {
    try {
      const { tenantId, id: userId, role } = req.userContext || {};
      const { sessionId } = req.params;
      const { notes } = req.body;

      // Only owners or managers can approve
      const isManagerOrOwner = ['owner', 'manager'].includes(role?.toLowerCase());
      if (!isManagerOrOwner) {
        return res.status(403).json({ error: 'Hanya Owner atau Manajer yang dapat menyetujui penyesuaian Stok Opname.' });
      }

      // 🔒 Owner-only Otoritas Guard Check
      try {
        const SystemService = require('../services/systemService');
        const settings = await SystemService.getSettings(tenantId);
        const isOwner = role?.toLowerCase() === 'owner';
        if (settings?.opname_owner_approval_required === true && !isOwner) {
          return res.status(403).json({ 
            error: 'Otoritas Ditolak: Pengaturan sistem saat ini mewajibkan persetujuan akhir langsung dari OWNER untuk memposting penyesuaian Stok Opname.' 
          });
        }
      } catch (sErr) {
        console.warn('⚠️ [Settings Guard Check Failed]:', sErr.message);
      }

      const result = await OpnameService.approveOpname(sessionId, userId, tenantId, notes);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async cancelOpname(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { sessionId } = req.params;

      const result = await OpnameService.cancelOpname(sessionId, tenantId);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async getOutletSummary(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { outletId } = req.params;

      if (!outletId) {
        return res.status(400).json({ error: 'Outlet ID wajib ditentukan.' });
      }

      const summary = await OpnameService.getOutletSummary(outletId, tenantId);
      res.json(summary);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new OpnameController();

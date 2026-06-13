// src/controllers/promoCodeController.js
const PromoCodeRepository = require('../repositories/promoCodeRepository');
const AppError = require('../utils/AppError');

class PromoCodeController {
  async create(req, res) {
    const tenantId = req.userContext?.tenantId || req.tenantId; // middleware sets tenantId
    const data = req.body;
    try {
      const promo = await PromoCodeRepository.create(tenantId, data);
      res.status(201).json(promo);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async list(req, res) {
    const tenantId = req.userContext?.tenantId || req.tenantId;
    try {
      const promos = await PromoCodeRepository.findAll(tenantId);
      res.json(promos);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async get(req, res) {
    const tenantId = req.userContext?.tenantId || req.tenantId;
    const { id } = req.params;
    try {
      const promo = await PromoCodeRepository.findByCode(tenantId, id);
      if (!promo) return res.status(404).json({ error: 'Promo not found' });
      res.json(promo);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async update(req, res) {
    const tenantId = req.userContext?.tenantId || req.tenantId;
    const { id } = req.params;
    const data = req.body;
    try {
      const updated = await PromoCodeRepository.update(tenantId, id, data);
      res.json(updated);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async delete(req, res) {
    const tenantId = req.userContext?.tenantId || req.tenantId;
    const { id } = req.params;
    try {
      await PromoCodeRepository.delete(tenantId, id);
      res.status(204).send();
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
  async validate(req, res) {
    const tenantId = req.userContext?.tenantId;
    const { code, subtotal } = req.body;
    
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant ID required' });
    }
    if (!code) {
      return res.status(400).json({ error: 'Kode promo harus diisi' });
    }

    try {
      const promo = await PromoCodeRepository.findByCode(tenantId, code);
      if (!promo) {
        return res.status(404).json({ error: 'Kode promo tidak ditemukan' });
      }
      if (!promo.is_active) {
        return res.status(400).json({ error: 'Kode promo sudah tidak aktif' });
      }
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return res.status(400).json({ error: 'Kode promo sudah kedaluwarsa' });
      }
      if (promo.usage_limit !== null && promo.usage_limit !== undefined && promo.used_count >= promo.usage_limit) {
        return res.status(400).json({ error: 'Batas penggunaan kode promo telah habis' });
      }
      
      const minAmount = Number(promo.min_order_amount || 0);
      const subtotalNum = Number(subtotal || 0);
      if (subtotalNum < minAmount) {
        return res.status(400).json({ 
          error: `Minimum pembelian untuk promo ini adalah Rp ${minAmount.toLocaleString('id-ID')}` 
        });
      }

      let discountAmount = 0;
      if (promo.type === 'percent') {
        discountAmount = Math.round((subtotalNum * Number(promo.value)) / 100);
      } else {
        discountAmount = Number(promo.value);
      }

      // Discount cannot exceed the subtotal
      if (discountAmount > subtotalNum) {
        discountAmount = subtotalNum;
      }

      res.json({
        valid: true,
        code: promo.code,
        type: promo.type,
        value: promo.value,
        discountAmount,
        id: promo.id,
        partner_id: promo.partner_id
      });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}

module.exports = new PromoCodeController();

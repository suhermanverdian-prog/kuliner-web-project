// src/controllers/promoCodeController.js
const PromoCodeRepository = require('../repositories/promoCodeRepository');
const AppError = require('../utils/AppError');

class PromoCodeController {
  async create(req, res) {
    const tenantId = req.tenantId; // middleware sets tenantId
    const data = req.body;
    try {
      const promo = await PromoCodeRepository.create(tenantId, data);
      res.status(201).json(promo);
    } catch (err) {
      new AppError(err.message, err.status || 500).send(res);
    }
  }

  async list(req, res) {
    const tenantId = req.tenantId;
    try {
      const promos = await PromoCodeRepository.findAll(tenantId);
      res.json(promos);
    } catch (err) {
      new AppError(err.message, err.status || 500).send(res);
    }
  }

  async get(req, res) {
    const tenantId = req.tenantId;
    const { id } = req.params;
    try {
      const promo = await PromoCodeRepository.findByCode(tenantId, id);
      if (!promo) return res.status(404).json({ error: 'Promo not found' });
      res.json(promo);
    } catch (err) {
      new AppError(err.message, err.status || 500).send(res);
    }
  }

  async update(req, res) {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const data = req.body;
    try {
      // Re‑use repository update via deactivate/activate pattern (simplified)
      const updated = await PromoCodeRepository.deactivate(tenantId, id); // placeholder for real update
      // In production, implement proper update method.
      res.json(updated);
    } catch (err) {
      new AppError(err.message, err.status || 500).send(res);
    }
  }

  async delete(req, res) {
    const tenantId = req.tenantId;
    const { id } = req.params;
    try {
      await PromoCodeRepository.deactivate(tenantId, id);
      res.status(204).send();
    } catch (err) {
      new AppError(err.message, err.status || 500).send(res);
    }
  }
}

module.exports = new PromoCodeController();

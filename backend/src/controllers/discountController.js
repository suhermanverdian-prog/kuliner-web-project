// src/controllers/discountController.js
const DiscountService = require('../services/discountService');

module.exports = {
  async create(req, res, next) {
    try {
      const tenantId = req.userContext.tenantId;
      const discount = await DiscountService.createDiscount(tenantId, req.body);
      res.status(201).json({ message: 'Discount berhasil dibuat', data: discount });
    } catch (err) {
      next(err);
    }
  },
  async list(req, res, next) {
    try {
      const tenantId = req.userContext.tenantId;
      const discounts = await DiscountService.getAllDiscounts(tenantId);
      res.json(discounts);
    } catch (err) {
      next(err);
    }
  },
  async getById(req, res, next) {
    try {
      const tenantId = req.userContext.tenantId;
      const discount = await DiscountService.getDiscountById(tenantId, req.params.id);
      res.json(discount);
    } catch (err) {
      next(err);
    }
  },
  async update(req, res, next) {
    try {
      const tenantId = req.userContext.tenantId;
      const discount = await DiscountService.updateDiscount(tenantId, req.params.id, req.body);
      res.json({ message: 'Discount berhasil diperbarui', data: discount });
    } catch (err) {
      next(err);
    }
  },
  async delete(req, res, next) {
    try {
      const tenantId = req.userContext.tenantId;
      const result = await DiscountService.deleteDiscount(tenantId, req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};

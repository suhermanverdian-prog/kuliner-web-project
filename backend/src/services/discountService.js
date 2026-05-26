// src/services/discountService.js
const DiscountRepository = require('../repositories/discountRepository');
const AppError = require('../utils/AppError');

class DiscountService {
  async createDiscount(tenantId, data) {
    // Validate type and value
    if (!['percent', 'fixed'].includes(data.type)) {
      throw new AppError('Tipe discount tidak valid (percent/fixed)', 400);
    }
    if (typeof data.value !== 'number' || data.value < 0) {
      throw new AppError('Nilai discount harus angka positif', 400);
    }
    // Additional business rules can be added here
    return await DiscountRepository.create(tenantId, data);
  }

  async getAllDiscounts(tenantId) {
    return await DiscountRepository.findAll(tenantId);
  }

  async getDiscountById(tenantId, id) {
    const discount = await DiscountRepository.findById(tenantId, id);
    if (!discount) throw new AppError('Discount tidak ditemukan', 404);
    return discount;
  }

  async updateDiscount(tenantId, id, data) {
    return await DiscountRepository.update(tenantId, id, data);
  }

  async deleteDiscount(tenantId, id) {
    await DiscountRepository.delete(tenantId, id);
    return { message: 'Discount berhasil dihapus' };
  }
}

module.exports = new DiscountService();

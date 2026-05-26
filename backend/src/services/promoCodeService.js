// src/services/promoCodeService.js
const PromoCodeRepository = require('../repositories/promoCodeRepository');
const AppError = require('../utils/AppError');

class PromoCodeService {
  /**
   * Validate a promo code for a given tenant and order amount.
   * Returns { isValid: boolean, promo: object|null, message: string }
   */
  async validate(code, tenantId, orderSubtotal) {
    const promo = await PromoCodeRepository.findByCode(tenantId, code);
    if (!promo) {
      return { isValid: false, promo: null, message: 'Kode promo tidak ditemukan' };
    }
    if (!promo.is_active) {
      return { isValid: false, promo: null, message: 'Kode promo tidak aktif' };
    }
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return { isValid: false, promo: null, message: 'Kode promo telah kedaluwarsa' };
    }
    if (promo.min_order_amount && orderSubtotal < promo.min_order_amount) {
      return { isValid: false, promo: null, message: `Minimal belanja Rp ${promo.min_order_amount}` };
    }
    // usage limits
    if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
      return { isValid: false, promo: null, message: 'Kode promo sudah mencapai batas penggunaan' };
    }
    // per‑user limit could be checked here with an additional query (omitted for brevity)
    return { isValid: true, promo, message: 'Valid' };
  }

  /** Increment usage counter after a successful order */
  async incrementUsage(tenantId, promoId) {
    const promo = await PromoCodeRepository.findByCode(tenantId, promoId);
    if (!promo) return;
    await PromoCodeRepository.deactivate(tenantId, promoId); // placeholder: real implementation would `update` used_count
  }
}

module.exports = new PromoCodeService();

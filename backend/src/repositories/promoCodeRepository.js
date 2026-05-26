// src/repositories/promoCodeRepository.js
const { supabase } = require('../supabase');
const AppError = require('../utils/AppError');

class PromoCodeRepository {
  async create(tenantId, promoData) {
    const payload = { ...promoData, tenant_id: tenantId };
    const { data, error } = await supabase.from('promo_codes').insert([payload]).select().single();
    if (error) throw new AppError('Gagal membuat promo code', 500);
    return data;
  }

  async findAll(tenantId) {
    const { data, error } = await supabase.from('promo_codes').select('*').eq('tenant_id', tenantId);
    if (error) throw new AppError('Gagal mengambil promo codes', 500);
    return data;
  }

  async findById(tenantId, id) {
    const { data, error } = await supabase.from('promo_codes')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new AppError('Gagal menemukan promo code', 500);
    return data;
  }

  async findByCode(tenantId, code) {
    const { data, error } = await supabase.from('promo_codes')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('code', code)
      .maybeSingle();
    if (error) throw new AppError('Gagal mencari promo code', 500);
    return data;
  }

  async update(tenantId, id, updateData) {
    const { data, error } = await supabase.from('promo_codes')
      .update(updateData)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new AppError('Gagal memperbarui promo code', 500);
    return data;
  }

  async delete(tenantId, id) {
    const { error } = await supabase.from('promo_codes')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', id);
    if (error) throw new AppError('Gagal menghapus promo code', 500);
    return true;
  }
}

module.exports = new PromoCodeRepository();

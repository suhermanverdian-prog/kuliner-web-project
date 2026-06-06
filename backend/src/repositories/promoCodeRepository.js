// src/repositories/promoCodeRepository.js
const { supabase } = require('../supabase');
const AppError = require('../utils/AppError');

const toDb = (data) => {
  const mapped = {};
  if (data.code !== undefined) mapped.coupon_code = data.code;
  if (data.type !== undefined) mapped.discount_type = data.type;
  if (data.value !== undefined) mapped.discount_value = data.value;
  if (data.min_order_amount !== undefined) mapped.max_discount_cap = data.min_order_amount;
  if (data.expires_at !== undefined) mapped.expires_at = data.expires_at;
  if (data.partner_id !== undefined) mapped.partner_id = data.partner_id || null;
  if (data.is_active !== undefined) mapped.is_used = !data.is_active;
  return mapped;
};

const toApp = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    partner_id: row.partner_id,
    code: row.coupon_code,
    type: row.discount_type,
    value: row.discount_value,
    min_order_amount: row.max_discount_cap || 0,
    expires_at: row.expires_at,
    is_active: !row.is_used,
    created_at: row.created_at
  };
};

class PromoCodeRepository {
  async create(tenantId, promoData) {
    const payload = { ...toDb(promoData), tenant_id: tenantId };
    const { data, error } = await supabase.from('b2b_coupons').insert([payload]).select().single();
    if (error) throw new AppError('Gagal membuat promo code: ' + error.message, 500);
    return toApp(data);
  }

  async findAll(tenantId) {
    const { data, error } = await supabase.from('b2b_coupons').select('*').eq('tenant_id', tenantId);
    if (error) throw new AppError('Gagal mengambil promo codes: ' + error.message, 500);
    return data.map(toApp);
  }

  async findById(tenantId, id) {
    const { data, error } = await supabase.from('b2b_coupons')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new AppError('Gagal menemukan promo code: ' + error.message, 500);
    return toApp(data);
  }

  async findByCode(tenantId, code) {
    const { data, error } = await supabase.from('b2b_coupons')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('coupon_code', code)
      .maybeSingle();
    if (error) throw new AppError('Gagal mencari promo code: ' + error.message, 500);
    return toApp(data);
  }

  async update(tenantId, id, updateData) {
    const { data, error } = await supabase.from('b2b_coupons')
      .update(toDb(updateData))
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new AppError('Gagal memperbarui promo code: ' + error.message, 500);
    return toApp(data);
  }

  async delete(tenantId, id) {
    const { error } = await supabase.from('b2b_coupons')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', id);
    if (error) throw new AppError('Gagal menghapus promo code: ' + error.message, 500);
    return true;
  }
}

module.exports = new PromoCodeRepository();

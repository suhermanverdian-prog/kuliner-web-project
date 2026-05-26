// src/repositories/discountRepository.js
const { supabase } = require('../supabase');
const AppError = require('../utils/AppError');

class DiscountRepository {
  async create(tenantId, discountData) {
    const payload = { ...discountData, tenant_id: tenantId };
    const { data, error } = await supabase.from('discounts').insert([payload]).select().single();
    if (error) throw new AppError('Gagal membuat discount', 500);
    return data;
  }

  async findAll(tenantId) {
    const { data, error } = await supabase.from('discounts').select('*').eq('tenant_id', tenantId);
    if (error) throw new AppError('Gagal mengambil discounts', 500);
    return data;
  }

  async findById(tenantId, id) {
    const { data, error } = await supabase.from('discounts').select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle();
    if (error) throw new AppError('Gagal menemukan discount', 500);
    return data;
  }

  async update(tenantId, id, updateData) {
    const { data, error } = await supabase.from('discounts').update(updateData).eq('tenant_id', tenantId).eq('id', id).select().single();
    if (error) throw new AppError('Gagal memperbarui discount', 500);
    return data;
  }

  async delete(tenantId, id) {
    const { error } = await supabase.from('discounts').delete().eq('tenant_id', tenantId).eq('id', id);
    if (error) throw new AppError('Gagal menghapus discount', 500);
    return true;
  }
}

module.exports = new DiscountRepository();

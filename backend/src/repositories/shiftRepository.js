const { supabase } = require('../supabase');
const AppError = require('../utils/AppError');

class ShiftRepository {
  /**
   * Mengambil semua shift dengan status tertentu, dibatasi ke tenant aktif.
   */
  async findByTenant(tenantId) {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Gagal mengambil data shift dari database', 500);
    return data;
  }

  /**
   * Mencari shift yang sedang "open" untuk tenant tertentu.
   */
  async findActiveShift(tenantId) {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'open')
      .maybeSingle();

    if (error) throw new AppError('Gagal mencari shift aktif', 500);
    return data;
  }

  /**
   * Mengambil shift berdasarkan ID untuk tenant tertentu.
   */
  async getById(tenantId, shiftId) {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', shiftId)
      .maybeSingle();

    if (error) throw new AppError('Gagal menemukan shift dengan ID', 500);
    return data;
  }

  async create(tenantId, shiftData) {
    const payload = {
      ...shiftData,
      tenant_id: tenantId,
    };

    const { data, error } = await supabase
      .from('shifts')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error on Create Shift:', error);
      throw new AppError('Gagal menyimpan shift baru: ' + error.message, 500);
    }
    return data;
  }

  /**
   * Mengupdate shift (contoh: untuk tutup shift).
   */
  async update(tenantId, shiftId, updateData) {
    const { data, error } = await supabase
      .from('shifts')
      .update(updateData)
      .eq('id', shiftId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('Supabase Error on Update Shift:', error);
      throw new AppError('Gagal memperbarui shift: ' + error.message, 500);
    }
    return data;
  }

  /**
   * Mengambil agregasi penjualan (transactions) sejak shift dimulai.
   */
  async getSalesAggregation(tenantId, startTime) {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('total, payment_method')
      .eq('tenant_id', tenantId)
      .eq('payment_status', 'paid')
      .gte('created_at', startTime);

    if (error) throw new AppError('Gagal mengambil data transaksi shift', 500);

    let currentSales = 0;
    let currentCash = 0;
    let currentQris = 0;
    let currentDebit = 0;

    (transactions || []).forEach(t => {
      const total = Number(t.total) || 0;
      currentSales += total;
      const pm = t.payment_method || 'Tunai';
      if (pm === 'Tunai') currentCash += total;
      else if (['QRIS', 'E-Wallet', 'Transfer', 'Transfer Bank'].includes(pm)) currentQris += total;
      else currentDebit += total;
    });

    return {
      currentSalesCount: (transactions || []).length,
      currentSales,
      currentCash,
      currentQris,
      currentDebit
    };
  }
}

module.exports = new ShiftRepository();

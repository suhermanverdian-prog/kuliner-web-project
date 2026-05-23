const shiftRepository = require('../repositories/shiftRepository');
const AppError = require('../utils/AppError');

class ShiftService {
  async _populateShift(shift, tenantId) {
    if (!shift) return null;
    if (shift.status === 'open') {
      const stats = await shiftRepository.getSalesAggregation(tenantId, shift.start_time);
      return {
        ...shift,
        openCash: shift.initial_cash,
        openTime: shift.start_time,
        ...stats,
      };
    } else {
      return {
        ...shift,
        openCash: shift.initial_cash,
        openTime: shift.start_time,
        currentSales: shift.total_sales || 0,
        currentSalesCount: 0,
      };
    }
  }

  async getAllShifts(tenantId) {
    if (!tenantId) throw new AppError('Akses Ditolak: Tenant ID tidak ditemukan.', 401);
    const shifts = await shiftRepository.findByTenant(tenantId);
    return await Promise.all(shifts.map(s => this._populateShift(s, tenantId)));
  }

  async getActiveShift(tenantId) {
    if (!tenantId) throw new AppError('Akses Ditolak: Tenant ID tidak ditemukan.', 401);
    const shift = await shiftRepository.findActiveShift(tenantId);
    return await this._populateShift(shift, tenantId);
  }

  async openShift(tenantId, shiftData) {
    if (!tenantId) throw new AppError('Akses Ditolak: Tenant ID tidak ditemukan.', 401);

    // Cek apakah sudah ada shift yang berjalan
    const existingShift = await shiftRepository.findActiveShift(tenantId);
    if (existingShift) {
      throw new AppError('Sudah ada sesi shift yang berjalan. Tutup shift aktif terlebih dahulu.', 400);
    }

    if (shiftData.openCash === undefined || shiftData.openCash < 0) {
      throw new AppError('Modal awal wajib diisi dan tidak boleh negatif.', 400);
    }

    return await shiftRepository.create(tenantId, {
      user_id: shiftData.userId,
      user_name: shiftData.userName || shiftData.kasir,
      start_time: shiftData.openTime || new Date().toISOString(),
      initial_cash: shiftData.openCash,
      status: 'open',
      current_cash: 0,
      current_qris: 0,
      total_sales: 0,
    });
  }

  async closeShift(tenantId, shiftId, closeData) {
    if (!tenantId) throw new AppError('Akses Ditolak: Tenant ID tidak ditemukan.', 401);

    const shift = await shiftRepository.findActiveShift(tenantId);
    if (!shift || shift.id !== shiftId) {
      throw new AppError('Shift tidak ditemukan atau sudah ditutup.', 404);
    }

    if (closeData.closingCash === undefined || closeData.closingCash < 0) {
      throw new AppError('Nilai uang fisik (closingCash) wajib diisi dengan benar.', 400);
    }

    // 2. Hitung Total Penjualan Real-Time dari Tabel Transaksi
    const stats = await shiftRepository.getSalesAggregation(tenantId, shift.start_time);
    const actualSales = stats.currentSales;

    // 3. Kalkulasi Audit Finansial
    const expectedCash = Number(shift.initial_cash) + actualSales;
    const difference = Number(closeData.closingCash) - expectedCash;

    const payload = {
      status: 'closed',
      end_time: new Date().toISOString(),
      total_sales: actualSales,
      expected_cash: expectedCash,
      closing_cash: Number(closeData.closingCash),
      difference: difference,
      notes: closeData.notes || '',
    };

    return await shiftRepository.update(tenantId, shiftId, payload);
  }
}

module.exports = new ShiftService();

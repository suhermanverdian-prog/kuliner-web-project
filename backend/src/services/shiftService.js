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
      // Shift tertutup – gunakan data yang tersimpan di DB bila ada
      return {
        ...shift,
        openCash: shift.initial_cash,
        openTime: shift.start_time,
        currentSales: shift.total_sales || 0,
        // Gunakan total_transactions jika tersedia, otherwise 0
        currentSalesCount: typeof shift.total_transactions === 'number' ? shift.total_transactions : 0,
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

    // Validate openCash must be a finite number >= 0
    if (typeof shiftData.openCash !== 'number' || isNaN(shiftData.openCash) || shiftData.openCash < 0) {
      throw new AppError('Modal awal wajib diisi dan harus berupa angka non‑negatif.', 400);
    }
    // Validate userId presence and format (basic UUID check)
    if (!shiftData.userId || typeof shiftData.userId !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(shiftData.userId)) {
      throw new AppError('User ID wajib diisi dengan format UUID yang valid.', 400);
    }

    return await shiftRepository.create(tenantId, {
      user_id: shiftData.userId,
      start_time: shiftData.openTime || new Date().toISOString(),
      initial_cash: shiftData.openCash,
      status: 'open',
      total_sales: 0,
    });
  }

  async getShiftAudit(tenantId, shiftId) {
    if (!tenantId) throw new AppError('Akses Ditolak: Tenant ID tidak ditemukan.', 401);
    if (!shiftId) throw new AppError('Shift ID tidak diberikan.', 400);
    // Ambil shift
    const shift = await shiftRepository.getById(tenantId, shiftId);
    if (!shift) throw new AppError('Shift tidak ditemukan.', 404);
    // Guard start_time
    const startTime = shift.start_time || new Date().toISOString();
    // Hitung agregasi penjualan sejak start_time with safe fallback
    let stats = { currentSales: 0, currentCash: 0, currentQris: 0, currentDebit: 0 };
    try {
        stats = await shiftRepository.getSalesAggregation(tenantId, startTime);
    } catch (e) {
        console.warn('⚠️ Sales aggregation failed, proceeding with zeros:', e.message);
    }
    const actualSales = stats.currentSales || 0;
    const expectedCash = Number(shift.initial_cash) + (stats.currentCash || 0);
    const closingCashVal = shift.closing_cash !== undefined && shift.closing_cash !== null ? Number(shift.closing_cash) : null;
    const difference = closingCashVal !== null ? closingCashVal - expectedCash : null;
    return {
        shiftId: shift.id,
        tenantId,
        startTime: shift.start_time,
        endTime: shift.end_time || null,
        initialCash: Number(shift.initial_cash),
        actualSales,
        expectedCash,
        closingCash: closingCashVal,
        difference,
        notes: shift.notes || ''
    };
}

}

module.exports = new ShiftService();

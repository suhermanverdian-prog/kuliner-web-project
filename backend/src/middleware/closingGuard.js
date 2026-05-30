const ClosingService = require('../services/closingService');

/**
 * Middleware to check if the transaction date or period is already closed.
 * If closed, blocks any state-modifying requests (POST, PUT, DELETE).
 */
const checkPeriodClosed = async (req, res, next) => {
  // Hanya blokir method mutasi (POST, PUT, DELETE)
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    try {
      const { tenantId, role } = req.userContext || {};
      
      // Superadmin bypass
      if (role === 'superadmin') return next();

      if (!tenantId) return next();

      // Dapatkan tanggal transaksi dari body (misal: created_at atau date)
      const dateStr = req.body?.created_at || req.body?.date || new Date().toISOString();
      const isClosed = await ClosingService.checkDateClosed(tenantId, dateStr);

      if (isClosed) {
        return res.status(400).json({ 
          error: `Aksi ditolak: Periode akuntansi untuk tanggal ${dateStr.slice(0, 10)} sudah ditutup (Tutup Buku Bulanan).` 
        });
      }
    } catch (err) {
      console.error('⚠️ [ClosingGuard] Error checking closing status:', err.message);
    }
  }
  next();
};

module.exports = checkPeriodClosed;

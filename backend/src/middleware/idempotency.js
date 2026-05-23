const redis = require('../utils/redis');

/**
 * @middleware idempotency
 * @description Mencegah eksekusi ganda untuk request yang sama (berdasarkan key)
 */
const idempotency = async (req, res, next) => {
  const key = req.headers['x-idempotency-key'];
  if (!key) return next();

  const { tenantId, outletId } = req.userContext;
  const cacheKey = `ken:${tenantId || 'global'}:${outletId || 'main'}:idempotency:${key}`;
  
  try {
    // 1. Cek dan Kunci secara Atomik (menggunakan Lua)
    // Jika tidak ada, set status "PROCESSING" selama 30 detik (lock)
    const cached = await redis.checkAndSetIdempotency(cacheKey, 'PROCESSING', 30);
    
    if (cached) {
      if (cached === 'PROCESSING') {
        return res.status(409).json({ error: 'Request sedang diproses, mohon tunggu.' });
      }
      console.log(`🛡️ [Idempotency] Duplicate detected for key: ${key}`);
      return res.status(200).json(cached);
    }

    // 2. Jika berhasil mengunci, lanjutkan proses dan simpan hasilnya di akhir
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redis.set(cacheKey, data, 3600); // Ganti "PROCESSING" dengan hasil asli
      } else {
        redis.del(cacheKey); // Jika error, hapus lock agar bisa dicoba lagi
      }
      return originalJson.call(this, data);
    };

    next();
  } catch (err) {
    next();
  }
};

module.exports = idempotency;

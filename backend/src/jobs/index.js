const cron = require('node-cron');
const InventoryService = require('../services/inventoryService');
const { supabase } = require('../supabase');

/**
 * @function initJobs
 * @description Inisialisasi semua background jobs (Workers)
 */
const initJobs = () => {
  console.log('👷 [Worker] Background Jobs Initialized');

  // 1. Cek Stok Kritis Setiap Jam
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ [Worker] Running Hourly Inventory Health Check...');
    try {
      // Ambil semua tenant aktif
      const { data: tenants } = await supabase.from('settings').select('tenant_id');
      
      for (const t of (tenants || [])) {
        await InventoryService.getStockPredictions(t.tenant_id);
        // Di masa depan: Kirim notifikasi WA/Email jika ada yang kritis
      }
    } catch (err) {
      console.error('❌ [Worker] Inventory Check Failed:', err.message);
    }
  });

  // 2. Bersihkan Log Lama (Setiap Malam Jam 00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('🧹 [Worker] Nightly System Cleanup Started...');
    // Logic: Archive transaction logs older than 2 years, etc.
  });

  // 3. Neural Prediction Pre-calculation (Setiap 6 Jam)
  cron.schedule('0 */6 * * *', async () => {
    console.log('🧠 [Worker] Updating Neural Stock Models...');
  });
};

module.exports = { initJobs };

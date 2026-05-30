const cron = require('node-cron');
const InventoryService = require('../services/inventoryService');
const OpnameScheduler = require('../services/opnameScheduler');
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
      }
    } catch (err) {
      console.error('❌ [Worker] Inventory Check Failed:', err.message);
    }
  });

  // 2. Bersihkan Log Lama (Setiap Malam Jam 00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('🧹 [Worker] Nightly System Cleanup Started...');
  });

  // 3. Neural Prediction Pre-calculation (Setiap 6 Jam)
  cron.schedule('0 */6 * * *', async () => {
    console.log('🧠 [Worker] Updating Neural Stock Models...');
  });

  // 4. Scheduled Opname Engine Trigger (Setiap Menit)
  cron.schedule('* * * * *', async () => {
    try {
      await OpnameScheduler.executeScheduledJobs();
    } catch (err) {
      console.error('❌ [Worker] Scheduled Opname Job Failed:', err.message);
    }
  });
};

module.exports = { initJobs };


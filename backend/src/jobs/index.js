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
  // Aturan KEN OS: Log audit/aktivitas boleh dibersihkan secara fisik demi penghematan DB
  cron.schedule('0 0 * * *', async () => {
    console.log('🧹 [Worker] Nightly System Cleanup Started...');
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const oneEightyDaysAgo = new Date();
      oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);

      const { count: logCount, error: logErr } = await supabase
        .from('activity_logs')
        .delete({ count: 'planned' })
        .lte('created_at', ninetyDaysAgo.toISOString());

      const { count: execCount, error: execErr } = await supabase
        .from('opname_schedule_executions')
        .delete({ count: 'planned' })
        .lte('created_at', oneEightyDaysAgo.toISOString());

      if (logErr) console.error('❌ [Worker] Activity logs cleanup error:', logErr.message);
      else console.log('✅ [Worker] Cleaned old activity logs');

      if (execErr) console.error('❌ [Worker] Opname executions cleanup error:', execErr.message);
      else console.log('✅ [Worker] Cleaned old opname executions');
    } catch (err) {
      console.error('❌ [Worker] Nightly System Cleanup Failed:', err.message);
    }
  });

  // 3. Neural Prediction Pre-calculation (Setiap 6 Jam)
  cron.schedule('0 */6 * * *', async () => {
    console.log('🧠 [Worker] Updating Neural Stock Models...');
    try {
      const { data: tenants } = await supabase.from('settings').select('tenant_id');
      for (const t of (tenants || [])) {
        // Memicu pre-kalkulasi prediksi stok untuk Neural Model
        await InventoryService.getStockPredictions(t.tenant_id);
      }
      console.log('✅ [Worker] Neural Stock Models updated for all active tenants');
    } catch (err) {
      console.error('❌ [Worker] Neural Stock Models Update Failed:', err.message);
    }
  });

  // 4. Scheduled Opname Engine Trigger (Setiap 5 Menit - Dioptimalkan dari 1 menit)
  cron.schedule('*/5 * * * *', async () => {
    try {
      await OpnameScheduler.executeScheduledJobs();
    } catch (err) {
      console.error('❌ [Worker] Scheduled Opname Job Failed:', err.message);
    }
  });

  // 5. Promo Code Expiry Cleaner (Setiap Jam)
  // Aturan KEN OS: Update is_used/is_active secara soft-delete/deaktivasi
  cron.schedule('0 * * * *', async () => {
    console.log('🎫 [Worker] Running Promo Code Expiry Cleaner...');
    try {
      const { error } = await supabase
        .from('b2b_coupons')
        .update({ is_used: true }) // Di repo, `is_active` ditranslasikan dari `!is_used`
        .lte('expires_at', new Date().toISOString())
        .eq('is_used', false);
      if (error) {
        console.error('❌ [Worker] Promo Code Expiry Cleaner Error:', error.message);
      } else {
        console.log('✅ [Worker] Expired promo codes deactivated');
      }
    } catch (err) {
      console.error('❌ [Worker] Promo Code Expiry Cleaner Failed:', err.message);
    }
  });

  // 6. Loyalty Points Expiry Engine (Setiap Malam Jam 01:00)
  cron.schedule('0 1 * * *', async () => {
    console.log('💎 [Worker] Running Loyalty Points Expiry Engine...');
    try {
      // Reset poin loyalty pelanggan jika sudah memasuki tahun baru atau masa kedaluwarsa sistem
      // Default: Reset poin ke 0 bagi yang memiliki poin > 0 dan updated_at lebih lama dari 1 tahun
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // A. customers CRM table
      const { error: custErr } = await supabase
        .from('customers')
        .update({ loyalty_points: 0 })
        .gt('loyalty_points', 0)
        .lte('updated_at', oneYearAgo.toISOString());

      // B. customer_points legacy table
      const { error: legacyErr } = await supabase
        .from('customer_points')
        .update({ points: 0, updated_at: new Date().toISOString() })
        .gt('points', 0)
        .lte('updated_at', oneYearAgo.toISOString());

      if (custErr) console.error('❌ [Worker] CRM loyalty expiry error:', custErr.message);
      if (legacyErr) console.error('❌ [Worker] Legacy loyalty expiry error:', legacyErr.message);
      console.log('✅ [Worker] Loyalty points expiry run complete');
    } catch (err) {
      console.error('❌ [Worker] Loyalty Points Expiry Engine Failed:', err.message);
    }
  });

  // 7. Shift Auto-Close Guard (Setiap 15 Menit)
  cron.schedule('*/15 * * * *', async () => {
    console.log('🛡️ [Worker] Running Shift Auto-Close Guard...');
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // Cari shift open yang berumur > 24 jam
      const { data: openShifts, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('status', 'open')
        .lte('start_time', twentyFourHoursAgo.toISOString());

      if (error) {
        console.error('❌ [Worker] Failed to fetch stale open shifts:', error.message);
        return;
      }

      for (const shift of (openShifts || [])) {
        console.warn(`⚠️ [Worker] Found stale open shift ${shift.id} for Tenant ${shift.tenant_id}. Closing automatically...`);
        
        // Hitung total penjualan aktual sejak shift dibuka
        const startTime = shift.start_time || new Date().toISOString();
        let currentSales = 0;
        let currentCash = 0;
        try {
          const { data: transactions } = await supabase
            .from('transactions')
            .select('total, payment_method')
            .eq('tenant_id', shift.tenant_id)
            .eq('payment_status', 'paid')
            .gte('created_at', startTime);

          (transactions || []).forEach(t => {
            const total = Number(t.total) || 0;
            currentSales += total;
            if ((t.payment_method || 'Tunai') === 'Tunai') currentCash += total;
          });
        } catch (e) {
          console.warn('⚠️ [Worker] Shift Auto-Close sales aggregation failed:', e.message);
        }

        const expectedCash = Number(shift.initial_cash) + currentCash;
        // Shift auto-close ditutup dengan closing_cash = expectedCash (selisih = 0)
        await supabase
          .from('shifts')
          .update({
            status: 'closed',
            end_time: new Date().toISOString(),
            closing_cash: expectedCash,
            total_sales: currentSales,
            expected_cash: expectedCash,
            difference: 0,
            notes: 'Closed automatically by Shift Auto-Close Guard (Session exceeded 24 hours)'
          })
          .eq('id', shift.id)
          .eq('tenant_id', shift.tenant_id);

        console.log(`✅ [Worker] Stale shift ${shift.id} closed automatically.`);
      }
    } catch (err) {
      console.error('❌ [Worker] Shift Auto-Close Guard Failed:', err.message);
    }
  });

  // 8. Session Token Purge (Setiap Malam Jam 03:00)
  // Opsional: Karena JWT stateless, kita bersihkan log otentikasi lama dari database jika ada tabel log masuk
  cron.schedule('0 3 * * *', async () => {
    console.log('🔑 [Worker] Session Token Purge running...');
    try {
      // Coba bersihkan session_logs jika ada (graceful fallback jika tabel tidak ada)
      const { error } = await supabase
        .from('session_logs')
        .delete()
        .lte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // hapus > 30 hari

      if (error && error.code !== 'PGRST116') {
        // Table doesn't exist, it's safe to ignore
      } else {
        console.log('✅ [Worker] Old session logs purged');
      }
    } catch (err) {
      // Fail silently for missing table
    }
  });
};

module.exports = { initJobs };


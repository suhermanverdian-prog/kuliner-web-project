// scratch/verify_rls_reports.js
const { createClient } = require('@supabase/supabase-js');
const ReportRepository = require('../backend/src/repositories/reportRepository');

const supabaseUrl = 'https://ixpamdylbkfukofexcgi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cGFtZHlsYmtmdWtvZmV4Y2dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg2NzkzOCwiZXhwIjoyMDkzNDQzOTM4fQ.4rBCdxI1_uEIQwb2cE3RaAgfkfpD-kp4wwOw6eBzMxA';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const OUTLET_A_BANDUNG = '7a050e9b-11f6-464b-815a-160eb85c11b9';
const OUTLET_B_JAKARTA = '15041657-7013-4ac0-86c5-435a0e2aa8dd';
const TENANT_ID = 'fba884db-967a-4e9f-bad8-79211f6b2cc6'; // Main Store

async function setupTestData() {
  console.log('🧹 Membersihkan transaksi pengujian lama...');
  await supabase.from('transactions').delete().eq('tenant_id', TENANT_ID).in('outlet_id', [OUTLET_A_BANDUNG, OUTLET_B_JAKARTA]);

  console.log('✍️ Memasukkan transaksi baru untuk Outlet A Bandung (Rp 100.000)...');
  await supabase.from('transactions').insert([
    {
      tenant_id: TENANT_ID,
      outlet_id: OUTLET_A_BANDUNG,
      total: 100000,
      payment_status: 'paid',
      payment_method: 'QRIS',
      order_number: 'TRX-BDG-001',
      items: []
    }
  ]);

  console.log('✍️ Memasukkan transaksi baru untuk Outlet B Jakarta (Rp 250.000)...');
  await supabase.from('transactions').insert([
    {
      tenant_id: TENANT_ID,
      outlet_id: OUTLET_B_JAKARTA,
      total: 250000,
      payment_status: 'paid',
      payment_method: 'Transfer',
      order_number: 'TRX-JKT-001',
      items: []
    }
  ]);
  console.log('✅ Data pengujian siap.');
}

async function verifyRLS() {
  await setupTestData();

  console.log('\n🔍 --- MEMULAI AUDIT RLS & SCOPE ---');
  const dateFilterStr = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(); // start from yesterday

  // Skenario 1: Manager Bandung
  const contextManagerBandung = {
    role: 'manager',
    tenantId: TENANT_ID,
    scope: 'outlet',
    allowed_outlets: [OUTLET_A_BANDUNG]
  };
  const trxBandung = await ReportRepository.getTransactionsSum(contextManagerBandung, dateFilterStr);
  const sumBandung = trxBandung.reduce((sum, r) => sum + r.total, 0);
  console.log(`👤 [MGR Bandung] Total Omzet Terbaca: Rp ${sumBandung.toLocaleString('id-ID')} (Diharapkan: Rp 100.000)`);

  // Skenario 2: Manager Jakarta
  const contextManagerJakarta = {
    role: 'manager',
    tenantId: TENANT_ID,
    scope: 'outlet',
    allowed_outlets: [OUTLET_B_JAKARTA]
  };
  const trxJakarta = await ReportRepository.getTransactionsSum(contextManagerJakarta, dateFilterStr);
  const sumJakarta = trxJakarta.reduce((sum, r) => sum + r.total, 0);
  console.log(`👤 [MGR Jakarta] Total Omzet Terbaca: Rp ${sumJakarta.toLocaleString('id-ID')} (Diharapkan: Rp 250.000)`);

  // Skenario 3: Owner (Global)
  const contextOwner = {
    role: 'owner',
    tenantId: TENANT_ID,
    scope: 'global',
    allowed_outlets: null
  };
  const trxOwner = await ReportRepository.getTransactionsSum(contextOwner, dateFilterStr);
  const sumOwner = trxOwner.reduce((sum, r) => sum + r.total, 0);
  console.log(`👑 [OWNER Global] Total Omzet Terbaca: Rp ${sumOwner.toLocaleString('id-ID')} (Diharapkan: Rp 350.000)`);

  // Evaluasi Kelulusan Audit
  if (sumBandung === 100000 && sumJakarta === 250000 && sumOwner === 350000) {
    console.log('\n🏆 [HASIL AUDIT] LULUS: Row-Level Security & Scope Enforcement Aktif Sempurna!');
  } else {
    console.error('\n🚨 [HASIL AUDIT] GAGAL: Terjadi kebocoran skop data!');
  }
}

verifyRLS().catch(console.error);

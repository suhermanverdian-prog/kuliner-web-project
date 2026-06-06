require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL atau SUPABASE_KEY tidak ditemukan di .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  try {
    console.log("📡 Mengambil daftar tenant dari Supabase...");
    const { data: tenants, error } = await supabase.from('tenants').select('*');
    if (error) throw error;

    if (!tenants || tenants.length === 0) {
      console.log("⚠️ Tidak ada tenant yang ditemukan.");
      return;
    }

    console.log(`Found ${tenants.length} tenants. Seeding billing and subscription data...`);

    const now = new Date();

    for (const tenant of tenants) {
      // Skip superadmin node to keep config clean
      if (tenant.id === '00000000-0000-0000-0000-000000000000') {
        console.log(`- Skip superadmin node: ${tenant.name}`);
        continue;
      }

      // Generate customized expiry dates and invoicing history based on tenant name
      let expiresAt;
      let paymentStatus = 'paid';
      let billingCycle = 'monthly';
      let billingHistory = [];

      if (tenant.name.toLowerCase().includes('main') || tenant.name.toLowerCase().includes('kopi')) {
        // Active Pro tenant
        const expDate = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000); // 25 days left
        expiresAt = expDate.toISOString();
        paymentStatus = 'paid';
        billingCycle = 'monthly';
        
        billingHistory = [
          {
            id: Date.now() - 5000000,
            invoice_number: `INV-${tenant.name.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
            amount: 299000,
            payment_method: 'QRIS',
            payment_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            expiry_date: expiresAt,
            status: 'success'
          },
          {
            id: Date.now() - 30000000,
            invoice_number: `INV-${tenant.name.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
            amount: 299000,
            payment_method: 'Transfer',
            payment_date: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(),
            expiry_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'success'
          }
        ];
      } else {
        // Expired or Grace period tenant
        const expDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // Expired 3 days ago
        expiresAt = expDate.toISOString();
        paymentStatus = 'unpaid';
        billingCycle = 'monthly';

        billingHistory = [
          {
            id: Date.now() - 60000000,
            invoice_number: `INV-${tenant.name.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
            amount: 350000,
            payment_method: 'Cash',
            payment_date: new Date(now.getTime() - 33 * 24 * 60 * 60 * 1000).toISOString(),
            expiry_date: expiresAt,
            status: 'success'
          }
        ];
      }

      const featureOverrides = {
        ...(tenant.feature_overrides || {}),
        subscription: {
          expires_at: expiresAt,
          payment_status: paymentStatus,
          billing_cycle: billingCycle
        },
        billing_history: billingHistory
      };

      console.log(`- Mengupdate tenant: ${tenant.name} (${tenant.id})`);
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ feature_overrides: featureOverrides })
        .eq('id', tenant.id);

      if (updateError) {
        console.error(`  ❌ Gagal update tenant ${tenant.name}:`, updateError.message);
      } else {
        console.log(`  ✅ Berhasil update tenant ${tenant.name}`);
      }
    }

    console.log("🎉 Seeding data billing selesai!");
  } catch (err) {
    console.error("❌ Terjadi kesalahan saat seeding:", err.message);
  }
}

seed();

// backend/scripts/seed_test_partner.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'dummy_key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Use provided TEST_TENANT_ID or generate a random UUID for testing
const tenantId = process.env.TEST_TENANT_ID || crypto.randomUUID();
// Generate a unique tenant name to avoid name collisions
const tenantName = `Test Tenant ${tenantId.slice(0, 8)}`;

async function seed() {
  try {
    // 0. Upsert tenant (insert if not exists)
    const { data: tenant, error: tenantErr } = await supabase
      .from('tenants')
      .upsert(
        {
          id: tenantId,
          name: tenantName,
          tier: 'b2b'
        },
        { onConflict: ['id'] }
      )
      .single();
    if (tenantErr) throw tenantErr;
    console.log('✅ Tenant ensured:', tenant.id, tenant.name);

    // 1. Insert test corporate partner
    const { data: partner, error: partnerErr } = await supabase
      .from('corporate_partners')
      .insert({
        tenant_id: tenantId,
        company_name: 'Test Partner Ltd.',
        billing_email: 'partner@example.com',
        partner_type: 'b2b',
        credit_limit: 500000,
        current_debt: 0,
        is_active: true
      })
      .single();
    if (partnerErr) throw partnerErr;
    console.log('✅ Inserted corporate partner:', partner.id);

    // 2. Insert B2B‑only promo code linked to partner
    const { data: coupon, error: couponErr } = await supabase
      .from('b2b_coupons')
      .insert({
        tenant_id: tenantId,
        partner_id: partner.id,
        coupon_code: 'ABC20',
        discount_type: 'fixed',
        discount_value: 20000, // Rp 20.000 discount
        max_discount_cap: 20000,
        is_used: false,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .single();
    if (couponErr) throw couponErr;
    console.log('✅ Inserted B2B coupon:', coupon.coupon_code);
    console.log('✅ Seeding complete.');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();

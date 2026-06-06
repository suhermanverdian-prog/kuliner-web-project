// scripts/seedTestPromo.js
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env'), override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY are required in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Starting DB seeding for B2B promo E2E test...');

  // 1. Get first tenant
  const { data: tenants, error: tenantErr } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(1);

  if (tenantErr || !tenants || tenants.length === 0) {
    console.error('Error fetching tenant:', tenantErr || 'No tenants found in db');
    process.exit(1);
  }

  const tenantId = tenants[0].id;
  console.log(`Using Tenant: ${tenants[0].name} (${tenantId})`);

  // 2. Create corporate partner "PT ABC" if not exists
  let partnerId;
  const { data: partners, error: partnerErr } = await supabase
    .from('corporate_partners')
    .select('id, company_name')
    .eq('tenant_id', tenantId)
    .eq('company_name', 'PT ABC');

  if (partnerErr) {
    console.error('Error fetching corporate partners:', partnerErr);
    process.exit(1);
  }

  if (partners && partners.length > 0) {
    partnerId = partners[0].id;
    console.log(`Found existing corporate partner PT ABC: ${partnerId}`);
  } else {
    const { data: newPartner, error: createPartnerErr } = await supabase
      .from('corporate_partners')
      .insert([
        {
          tenant_id: tenantId,
          company_name: 'PT ABC',
          billing_email: 'finance@abc.com',
          partner_type: 'b2b',
          credit_limit: 1000000.00,
          current_debt: 0.00,
          is_active: true
        }
      ])
      .select()
      .single();

    if (createPartnerErr) {
      console.error('Error creating PT ABC corporate partner:', createPartnerErr);
      process.exit(1);
    }
    partnerId = newPartner.id;
    console.log(`Created corporate partner PT ABC: ${partnerId}`);
  }

  // 3. Create coupon code "ABC20" for PT ABC
  const couponCode = 'ABC20';
  const { data: existingCoupon, error: couponErr } = await supabase
    .from('b2b_coupons')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('coupon_code', couponCode)
    .maybeSingle();

  if (couponErr) {
    console.error('Error checking existing coupon:', couponErr);
    process.exit(1);
  }

  if (existingCoupon) {
    // Reactivate and link it to partner PT ABC
    const { error: updateCouponErr } = await supabase
      .from('b2b_coupons')
      .update({
        partner_id: partnerId,
        discount_type: 'fixed',
        discount_value: 20000.00,
        is_used: false,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      })
      .eq('id', existingCoupon.id);

    if (updateCouponErr) {
      console.error('Error updating coupon ABC20:', updateCouponErr);
      process.exit(1);
    }
    console.log(`Updated existing coupon ABC20 to point to partner PT ABC`);
  } else {
    // Insert new coupon
    const { error: insertCouponErr } = await supabase
      .from('b2b_coupons')
      .insert([
        {
          tenant_id: tenantId,
          partner_id: partnerId,
          coupon_code: couponCode,
          discount_type: 'fixed',
          discount_value: 20000.00,
          max_discount_cap: 0.00,
          is_used: false,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);

    if (insertCouponErr) {
      console.error('Error inserting new coupon ABC20:', insertCouponErr);
      process.exit(1);
    }
    console.log(`Successfully seeded coupon ABC20 linked to PT ABC!`);
  }

  console.log('DB Seeding finished successfully!');
}

run();

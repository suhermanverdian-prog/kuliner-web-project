const { supabase } = require('../supabase');
const fs = require('fs');
const path = require('path');
const SystemService = require('./systemService');

const dataPath = path.join(__dirname, '../../db/data.json');

function getLocalPoints() {
  try {
    if (fs.existsSync(dataPath)) {
      const content = fs.readFileSync(dataPath, 'utf8');
      const parsed = JSON.parse(content);
      return parsed.customer_points || [];
    }
  } catch (err) {}
  return [];
}

function saveLocalPoints(pointsList) {
  try {
    let parsed = {};
    if (fs.existsSync(dataPath)) {
      const content = fs.readFileSync(dataPath, 'utf8');
      parsed = JSON.parse(content);
    }
    parsed.customer_points = pointsList;
    fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf8');
    return true;
  } catch (err) {
    return false;
  }
}

class LoyaltyService {
  static async earnPoints(tenantId, customerPhone, customerName, amount) {
    if (!customerPhone) throw new Error('Nomor telepon pelanggan wajib disertakan');
    
    // 1. Get loyalty configuration
    let baseMultiplier = 1;
    let enabled = true;
    let tierRules = {
      member: { min_spend: 250000, min_visits: 3, points_multiplier: 1.5 },
      vip: { min_spend: 1000000, min_visits: 10, points_multiplier: 2.0 }
    };

    try {
      const settings = await SystemService.getLoyaltySettings(tenantId);
      if (settings) {
        enabled = settings.enabled !== false;
        baseMultiplier = Number(settings.multiplier || 1);
      }
      
      const { data: sData } = await supabase.from('settings').select('tier_rules').eq('tenant_id', tenantId).maybeSingle();
      if (sData && sData.tier_rules) {
        tierRules = sData.tier_rules;
      }
    } catch (e) {
      console.warn('⚠️ Gagal memuat pengaturan loyalty/tier_rules:', e.message);
    }

    if (!enabled) {
      return { success: false, message: 'Program loyalty dinonaktifkan', pointsEarned: 0 };
    }

    // 2. Fetch current customer totalSpend and visits to determine their multiplier
    let totalSpend = 0;
    let visits = 0;
    try {
      const { data: txs } = await supabase
        .from('transactions')
        .select('total')
        .eq('tenant_id', tenantId)
        .eq('payment_status', 'paid')
        .eq('items->>customer_phone', customerPhone);
      
      visits = txs ? txs.length : 0;
      totalSpend = txs ? txs.reduce((sum, t) => sum + Number(t.total || 0), 0) : 0;
    } catch (err) {
      console.warn('⚠️ Gagal memuat transaksi untuk perhitungan tier:', err.message);
    }

    // Determine tier multiplier
    let tierMultiplier = 1.0;
    if (totalSpend >= (tierRules.vip?.min_spend ?? 1000000) || visits >= (tierRules.vip?.min_visits ?? 10)) {
      tierMultiplier = Number(tierRules.vip?.points_multiplier ?? 2.0);
    } else if (totalSpend >= (tierRules.member?.min_spend ?? 250000) || visits >= (tierRules.member?.min_visits ?? 3)) {
      tierMultiplier = Number(tierRules.member?.points_multiplier ?? 1.5);
    }

    // Calculate points earned
    const pointsEarned = Math.floor((amount / 10000) * baseMultiplier * tierMultiplier);
    if (pointsEarned <= 0) {
      return { success: true, pointsEarned: 0, message: 'Transaksi kurang dari batas minimal poin' };
    }
    let finalPoints = pointsEarned;
    let finalVisits = 1;
    let success = false;

    // A. Update primary CRM table: 'customers'
    try {
      const { data: customer, error: custFetchErr } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('phone', customerPhone)
        .maybeSingle();

      if (!custFetchErr && customer) {
        finalPoints = Number(customer.loyalty_points || 0) + pointsEarned;
        const { error: custUpdateErr } = await supabase
          .from('customers')
          .update({ loyalty_points: finalPoints })
          .eq('id', customer.id);
        
        if (!custUpdateErr) {
          success = true;
          console.log(`✓ CRM points synced for ${customerName}. New points: ${finalPoints}`);
        }
      }
    } catch (e) {
      console.warn('⚠️ Gagal memperbarui poin di tabel customers:', e.message);
    }

    // B. Update/Insert into legacy 'customer_points' table if it exists
    try {
      const { data: existing, error: fetchErr } = await supabase
        .from('customer_points')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('customer_phone', customerPhone)
        .maybeSingle();

      if (!fetchErr) {
        if (existing) {
          finalVisits = Number(existing.total_visits || 0) + 1;
          const { error: updateErr } = await supabase
            .from('customer_points')
            .update({
              points: finalPoints,
              total_visits: finalVisits,
              customer_name: customerName || existing.customer_name,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
          if (!updateErr) success = true;
        } else {
          const payload = {
            id: supabase.auth.admin ? undefined : require('crypto').randomUUID(),
            tenant_id: tenantId,
            customer_phone: customerPhone,
            customer_name: customerName || 'Tamu Member',
            points: finalPoints,
            total_visits: finalVisits,
            updated_at: new Date().toISOString()
          };
          const { error: insertErr } = await supabase
            .from('customer_points')
            .insert([payload]);
          if (!insertErr) success = true;
        }
      }
    } catch (err) {
      // Legacy table update failed (likely missing table)
    }

    if (success) {
      return { success: true, pointsEarned, totalPoints: finalPoints, totalVisits: finalVisits };
    }

    // Fallback to local data.json if all database writes fail or offline
    console.warn('⚠️ Supabase database update failed, falling back to local storage');
    try {
      const localPoints = getLocalPoints();
      const idx = localPoints.findIndex(p => p.tenant_id === tenantId && p.customer_phone === customerPhone);
      let totalPoints = pointsEarned;
      let totalVisits = 1;

      if (idx >= 0) {
        totalPoints = Number(localPoints[idx].points || 0) + pointsEarned;
        totalVisits = Number(localPoints[idx].total_visits || 0) + 1;
        localPoints[idx] = {
          ...localPoints[idx],
          points: totalPoints,
          total_visits: totalVisits,
          customer_name: customerName || localPoints[idx].customer_name,
          updated_at: new Date().toISOString()
        };
      } else {
        localPoints.push({
          id: 'point-' + Date.now(),
          tenant_id: tenantId,
          customer_phone: customerPhone,
          customer_name: customerName || 'Tamu Member',
          points: totalPoints,
          total_visits: totalVisits,
          updated_at: new Date().toISOString()
        });
      }
      
      saveLocalPoints(localPoints);
      return { success: true, pointsEarned, totalPoints, totalVisits };
    } catch (fallbackErr) {
      return { success: false, error: fallbackErr.message };
    }
  }

  static async getCustomerData(tenantId, phone) {
    if (!phone) throw new Error('Nomor telepon wajib disertakan');

    let customerInfo = { points: 0, total_visits: 0, customer_name: 'Member Premium', customer_phone: phone };
    let history = [];

    // 1. Fetch points & visits
    try {
      const { data, error } = await supabase
        .from('customer_points')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('customer_phone', phone)
        .maybeSingle();

      if (!error && data) {
        customerInfo = data;
      } else {
        // Fallback to local
        const localPoints = getLocalPoints();
        const found = localPoints.find(p => p.tenant_id === tenantId && p.customer_phone === phone);
        if (found) {
          customerInfo = found;
        }
      }
    } catch (e) {
      const localPoints = getLocalPoints();
      const found = localPoints.find(p => p.tenant_id === tenantId && p.customer_phone === phone);
      if (found) {
        customerInfo = found;
      }
    }

    // 2. Fetch last 5 transactions
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('customer_name', customerInfo.customer_name)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        history = data;
      }
    } catch (e) {
      console.warn('⚠️ Gagal mengambil riwayat transaksi dari Supabase:', e.message);
    }

    return {
      points: customerInfo.points || 0,
      total_visits: customerInfo.total_visits || 0,
      customer_name: customerInfo.customer_name,
      customer_phone: customerInfo.customer_phone,
      history
    };
  }
}

module.exports = LoyaltyService;

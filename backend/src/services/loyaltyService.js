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
    
    // 1. Get loyalty multiplier from settings
    let multiplier = 1;
    let enabled = true;
    try {
      const settings = await SystemService.getLoyaltySettings(tenantId);
      if (settings) {
        enabled = settings.enabled !== false;
        multiplier = Number(settings.multiplier || 1);
      }
    } catch (e) {
      console.warn('⚠️ Gagal memuat pengaturan loyalty, menggunakan multiplier default (1):', e.message);
    }

    if (!enabled) {
      return { success: false, message: 'Program loyalty dinonaktifkan', pointsEarned: 0 };
    }

    // 1 point per Rp 10.000 multiplied by setting multiplier
    const pointsEarned = Math.floor((amount / 10000) * multiplier);
    if (pointsEarned <= 0) {
      return { success: true, pointsEarned: 0, message: 'Transaksi kurang dari batas minimal poin' };
    }

    try {
      // Try Supabase first
      // Check if table exists by trying to fetch
      const { data: existing, error: fetchErr } = await supabase
        .from('customer_points')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('customer_phone', customerPhone)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      let finalPoints = pointsEarned;
      let finalVisits = 1;
      
      if (existing) {
        finalPoints = Number(existing.points || 0) + pointsEarned;
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
        
        if (updateErr) throw updateErr;
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
          
        if (insertErr) throw insertErr;
      }

      return { success: true, pointsEarned, totalPoints: finalPoints, totalVisits: finalVisits };
    } catch (err) {
      console.warn('⚠️ Supabase customer_points update failed, falling back to local storage:', err.message);
      
      // Fallback to local data.json
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

const { supabase } = require('../supabase');

class PredictionService {
  /**
   * Mengambil saran pengisian stok bahan baku cerdas (ARIMA-like consumption analysis).
   * @param {string} tenantId 
   */
  static async getReplenishmentSuggestions(tenantId) {
    try {
      // 1. Ambil seluruh data bahan beserta stok saat ini
      const { data: bahanList, error: bErr } = await supabase
        .from('bahan')
        .select('id, name, stock, cost, unit, bom')
        .eq('tenant_id', tenantId);

      if (bErr) throw bErr;
      if (!bahanList || bahanList.length === 0) return [];

      // 2. Ambil Purchase Orders yang sedang berjalan (pending / partially_received) untuk pencegahan double-ordering
      const { data: activePOs, error: poErr } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          status,
          purchase_order_items (
            bahan_id,
            purchase_qty
          )
        `)
        .eq('tenant_id', tenantId)
        .in('status', ['pending', 'partially_received']);

      if (poErr) {
        console.warn('⚠️ [Prediction] Gagal memuat active POs:', poErr.message);
      }

      // Buat set ID bahan baku yang saat ini sudah memiliki PO berjalan
      const onTheWayItems = new Set();
      (activePOs || []).forEach(po => {
        const items = po.purchase_order_items || po.items || [];
        (items || []).forEach(item => {
          const bahanId = item.bahan_id || item.bahanId;
          const qtyOrdered = Number(item.purchase_qty || item.purchaseQty || 0);
          const qtyReceived = Number(item.received_qty || item.receivedQty || 0);
          if (bahanId && qtyOrdered > qtyReceived) {
            onTheWayItems.add(String(bahanId));
          }
        });
      });

      // 3. Ambil riwayat stock movements dari inventory_logs dalam 30 hari terakhir untuk menghitung laju konsumsi harian
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: movements, error: mErr } = await supabase
        .from('inventory_logs')
        .select('bahan_id, change_qty, type, created_at')
        .eq('tenant_id', tenantId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (mErr) {
        console.warn('⚠️ [Prediction] Gagal memuat inventory_logs, menggunakan konsumsi default:', mErr.message);
      }

      // Hitung konsumsi per bahan
      const consumptionMap = {};
      (movements || []).forEach(mv => {
        const isReduction = mv.type === 'Sales' || mv.type === 'Pengurangan' || mv.type === 'Waste' || Number(mv.change_qty) < 0;
        if (isReduction) {
          const qty = Math.abs(Number(mv.change_qty));
          consumptionMap[mv.bahan_id] = (consumptionMap[mv.bahan_id] || 0) + qty;
        }
      });

      // 3.5. Hubungkan bahan dengan supplier_id berdasarkan BOM marker, fallback ke riwayat purchase_orders terbaru
      const supplierMapping = {};
      
      // A. Ambil dari BOM
      bahanList.forEach(bahan => {
        if (Array.isArray(bahan.bom)) {
          const marker = bahan.bom.find(item => item && item.isSupplierMarker);
          if (marker && marker.supplierId) {
            supplierMapping[bahan.id] = marker.supplierId;
          }
        }
      });

      // B. Fallback ke PO History
      const { data: allPOs, error: allPoErr } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          supplier_id,
          created_at,
          purchase_order_items (
            bahan_id
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (!allPoErr && allPOs) {
        allPOs.forEach(po => {
          const items = po.purchase_order_items || [];
          items.forEach(item => {
            const bId = item.bahan_id;
            if (bId && po.supplier_id && !supplierMapping[bId]) {
              supplierMapping[bId] = po.supplier_id;
            }
          });
        });
      }

      // 4. Kalkulasikan Rekomendasi
      const suggestions = [];
      bahanList.forEach(bahan => {
        const totalConsumed = consumptionMap[bahan.id] || 0;
        const dailyRate = Math.max(0.1, totalConsumed / 30); 
        const currentStock = Number(bahan.stock) || 0;
        const daysRemaining = Math.round(currentStock / dailyRate);

        const safetyDaysThreshold = 7;
        const targetDays = 30;
        const isCritical = daysRemaining <= safetyDaysThreshold;

        // Aturan Anti Double-Ordering: Jika sudah OTW di PO berjalan, set suggestedQty ke 0
        const isOtw = onTheWayItems.has(String(bahan.id));
        let suggestedQty = 0;
        if (isCritical && !isOtw) {
          suggestedQty = Math.ceil((dailyRate * targetDays) - currentStock);
        }

        suggestions.push({
          id: bahan.id,
          name: bahan.name,
          unit: bahan.unit,
          supplier_id: supplierMapping[bahan.id] || null,
          currentStock: currentStock,
          dailyRate: parseFloat(dailyRate.toFixed(2)),
          daysRemaining: daysRemaining === Infinity ? 999 : daysRemaining,
          status: isCritical ? 'Kritis' : 'Aman',
          isOtw: isOtw, // Sertakan flag OTW untuk visualisasi UI kasir
          suggestedQty: Math.max(0, suggestedQty),
          estimatedCost: Math.max(0, suggestedQty) * (Number(bahan.cost) || 0)
        });
      });

      return suggestions;
    } catch (err) {
      console.error('❌ [PredictionService] Error calculating suggestions:', err);
      throw err;
    }
  }
}

module.exports = PredictionService;

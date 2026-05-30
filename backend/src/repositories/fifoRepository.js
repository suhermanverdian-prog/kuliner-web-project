const { supabase } = require('../supabase');

class FifoRepository {
  /**
   * Insert a new inventory batch when goods are received.
   */
  async addBatch({ tenant_id, bahan_id, qty_initial, cost_per_unit, po_id }) {
    if (!tenant_id || !bahan_id) return;
    
    const { data, error } = await supabase.from('inventory_batches').insert([{
      tenant_id,
      bahan_id,
      qty_initial,
      qty_remaining: qty_initial,
      cost_per_unit,
      po_id: po_id || null
    }]).select().single();
    
    if (error) {
      console.error('⚠️ [FIFO] Gagal menambahkan batch:', error.message);
      throw error;
    }
    return data;
  }

  /**
   * Deduct stock using FIFO logic and return the total COGS (HPP) for this reduction.
   */
  async deductStockFifo(tenantId, bahanId, qtyToSub) {
    let remainingToSub = Number(qtyToSub);
    let totalCogs = 0;

    // 1. Ambil batch-batch yang masih memiliki sisa stock (diurutkan dari yang paling tua)
    const { data: batches, error } = await supabase
      .from('inventory_batches')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('bahan_id', bahanId)
      .gt('qty_remaining', 0)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('⚠️ [FIFO] Gagal mengambil batch:', error.message);
      throw error;
    }

    if (!batches || batches.length === 0) {
      // Jika tidak ada batch FIFO, fallback ke average/static cost di master bahan
      const { data: bahanInfo } = await supabase.from('bahan').select('cost').eq('id', bahanId).maybeSingle();
      const fallbackCost = bahanInfo?.cost || 0;
      return Math.round(remainingToSub * fallbackCost);
    }

    // 2. Iterasi batch tertua dan potong sisa stocknya
    for (const batch of batches) {
      if (remainingToSub <= 0) break;

      const availableQty = Number(batch.qty_remaining);
      const deductQty = Math.min(availableQty, remainingToSub);
      
      const newRemaining = availableQty - deductQty;
      const batchCogs = deductQty * Number(batch.cost_per_unit);
      
      totalCogs += batchCogs;
      remainingToSub -= deductQty;

      // Update qty_remaining di database
      await supabase
        .from('inventory_batches')
        .update({ qty_remaining: newRemaining })
        .eq('id', batch.id);
    }

    // Jika masih ada sisa yang harus dipotong tapi semua batch habis (Negative Inventory Case)
    if (remainingToSub > 0) {
       // Ambil cost dari batch terakhir yang baru saja habis sebagai asumsi harga saat ini
       const lastCost = batches[batches.length - 1].cost_per_unit;
       totalCogs += (remainingToSub * Number(lastCost));
    }

    return Math.round(totalCogs);
  }
}

module.exports = new FifoRepository();

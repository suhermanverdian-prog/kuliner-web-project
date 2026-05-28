const { supabase } = require('../supabase');

class ProcurementRepository {
  
  // --- Purchase Orders ---
  async getPurchaseOrders(tenantId, filters = {}) {
    let query = supabase.from('purchase_orders').select('*');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) query = query.eq(key, filters[key]);
    });

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getPOItems(poIds) {
    if (!poIds || poIds.length === 0) return [];
    const { data, error } = await supabase.from('purchase_order_items').select('*, bahan(name)').in('po_id', poIds);
    if (error) throw error;
    return data || [];
  }

  async createPOHeader(payload) {
    const { data, error } = await supabase.from('purchase_orders').insert([payload]).select().single();
    if (error) throw error;
    return data;
  }

  async createPOItems(items) {
    const { error } = await supabase.from('purchase_order_items').insert(items);
    if (error) throw error;
    return true;
  }

  async updatePOStatus(id, status) {
    const { error } = await supabase.from('purchase_orders').update({ status }).eq('id', id);
    if (error) throw error;
    return true;
  }

  // --- Invoices ---
  async getInvoices(tenantId) {
    let query = supabase.from('purchase_invoices').select('*');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getInvoiceById(id) {
    const { data, error } = await supabase.from('purchase_invoices').select('*, supplier:suppliers(name)').eq('id', id).single();
    if (error) throw error;
    return data;
  }

  async createInvoice(payload) {
    const { error } = await supabase.from('purchase_invoices').insert([payload]);
    if (error) throw error;
    return true;
  }

  async updateInvoice(id, payload) {
    const { error } = await supabase.from('purchase_invoices').update(payload).eq('id', id);
    if (error) throw error;
    return true;
  }

  // --- GRN (Good Receipt Notes) ---
  async getGRNsByPO(poIds) {
    if (!poIds || poIds.length === 0) return [];
    const { data, error } = await supabase.from('grns').select('id, po_id').in('po_id', poIds);
    if (error) throw error;
    return data || [];
  }

  async getGRNItemsByGRNIds(grnIds) {
    if (!grnIds || grnIds.length === 0) return [];
    const { data, error } = await supabase.from('grn_items').select('grn_id, bahan_id, qty_received').in('grn_id', grnIds);
    if (error) throw error;
    return data || [];
  }

  async createGRNHeader(payload) {
    const { data, error } = await supabase.from('grns').insert([payload]).select().single();
    if (error) throw error;
    return data;
  }

  async createGRNItems(items) {
    const { error } = await supabase.from('grn_items').insert(items);
    if (error) throw error;
    return true;
  }

  // --- Suppliers ---
  async getSuppliers(tenantId) {
    let query = supabase.from('suppliers').select('*').order('name');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createSupplier(payload) {
    const { data, error } = await supabase.from('suppliers').insert([payload]).select().single();
    if (error) throw error;
    return data;
  }

  async updateSupplier(id, payload) {
    const { data, error } = await supabase.from('suppliers').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  // --- Metadata & Misc ---
  async getUnitConversions(tenantId) {
    let query = supabase.from('unit_conversions').select('*, bahan(name)');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getConversionsByBahanId(bahanId) {
    const { data, error } = await supabase.from('unit_conversions').select('from_unit, to_unit, multiplier').eq('bahan_id', bahanId);
    if (error) throw error;
    return data || [];
  }

  async getPOItemForConversion(poId, bahanId) {
    const { data, error } = await supabase.from('purchase_order_items').select('purchase_unit, purchase_qty, bahan(unit)').eq('po_id', poId).eq('bahan_id', bahanId).maybeSingle();
    if (error) throw error;
    return data;
  }

  async getBahanStock(bahanId) {
    const { data, error } = await supabase.from('bahan').select('stock, cost, unit').eq('id', bahanId).single();
    if (error) throw error;
    return data;
  }

  async updateBahanStockAndCost(bahanId, newStock, newCost) {
    const { error } = await supabase.from('bahan').update({ stock: newStock, cost: newCost }).eq('id', bahanId);
    if (error) throw error;
    return true;
  }

  // --- Audit & Journal ---
  async logAudit(payload) {
    const { error } = await supabase.from('audit_logs').insert([payload]);
    if (error) throw error;
    return true;
  }

  async createJournal(headerPayload, linesPayload) {
    const tenantId = headerPayload.tenant_id;
    // Resolve account_id and account_name dynamically from accounts table to ensure database integrity
    const codes = linesPayload.map(l => l.account_code).filter(Boolean);
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, code, name')
      .eq('tenant_id', tenantId)
      .in('code', codes);

    const { data: journalEntry, error: jErr } = await supabase.from('journals').insert([headerPayload]).select().single();
    if (jErr) throw jErr;

    const linesWithJId = linesPayload.map(l => {
      const dbAcc = accounts?.find(a => a.code === l.account_code);
      return {
        ...l,
        journal_id: journalEntry.id,
        account_id: l.account_id || dbAcc?.id || null,
        account_name: l.account_name || dbAcc?.name || 'Account ' + l.account_code
      };
    });

    const { error: lErr } = await supabase.from('journal_lines').insert(linesWithJId);
    if (lErr) throw lErr;
    
    return journalEntry;
  }
}

module.exports = new ProcurementRepository();

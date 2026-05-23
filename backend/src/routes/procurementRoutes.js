const express = require('express');
const router = express.Router();
const permissionGuard = require('../middlewares/permissionGuard');
const journalGuard = require('../middlewares/journalGuard');
const procurementController = require('../controllers/procurementController');

// 1. GET ALL POS
router.get('/pos', permissionGuard('procurement', 'view'), procurementController.getPurchaseOrders);

// 2. GET ALL INVOICES
router.get('/invoices', permissionGuard('procurement', 'view'), procurementController.getInvoices);

// 3. GET ALL CONVERSIONS
router.get('/conversions', permissionGuard('procurement', 'view'), procurementController.getConversions);

// 4. GET ALL SUPPLIERS
router.get('/suppliers', permissionGuard('procurement', 'view'), procurementController.getSuppliers);

// 5. ADD NEW PURCHASE ORDER
router.post('/pos', permissionGuard('procurement', 'create'), procurementController.createPurchaseOrder);

// 6. ADD NEW SUPPLIER
router.post('/suppliers', permissionGuard('procurement', 'create'), procurementController.createSupplier);

// 7. ADD NEW GRN (Good Receipt Note)
router.post('/grns', permissionGuard('procurement', 'create'), journalGuard, procurementController.processGRN);

// 8. UPDATE INVOICE
router.put('/invoices', permissionGuard('procurement', 'update'), journalGuard, procurementController.updateInvoiceStatus);

// 9. PAY INVOICE
router.post('/invoices/:id/pay', permissionGuard('procurement', 'update'), journalGuard, procurementController.payInvoice);

// 10. CANCEL PO (Soft-cancel — status → cancelled, tidak hapus fisik)
router.patch('/pos/:id/cancel', permissionGuard('procurement', 'update'), async (req, res) => {
  try {
    const { tenantId } = req.userContext || {};
    const { id } = req.params;
    const supabase = require('../config/supabase');

    // Validasi: hanya PO dengan status pending/partially_received yang bisa dibatalkan
    const { data: po, error: fetchErr } = await supabase
      .from('purchase_orders')
      .select('id, status')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchErr || !po) return res.status(404).json({ error: 'PO tidak ditemukan.' });
    if (!['pending', 'partially_received'].includes(po.status)) {
      return res.status(400).json({ error: `PO tidak bisa dibatalkan karena status saat ini adalah: ${po.status}` });
    }

    const { error: updateErr } = await supabase
      .from('purchase_orders')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (updateErr) throw updateErr;
    return res.json({ success: true, message: 'PO berhasil dibatalkan.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

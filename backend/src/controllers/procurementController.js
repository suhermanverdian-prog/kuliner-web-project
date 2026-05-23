const ProcurementService = require('../services/procurementService');

class ProcurementController {

  async getPurchaseOrders(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const result = await ProcurementService.getPurchaseOrders(tenantId, req.query);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async createPurchaseOrder(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { supplierId, items, notes } = req.body;
      const po = await ProcurementService.createPO(supplierId, items, notes, tenantId);
      res.json(po);
    } catch (err) {
      console.error('❌ [Fatal PO Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getInvoices(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const result = await ProcurementService.getInvoices(tenantId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateInvoiceStatus(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { id, status } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Invoice ID is required.' });
      }

      const result = await ProcurementService.updateInvoiceStatus(id, status, tenantId);
      res.json(result);
    } catch (err) {
      console.error('❌ [Invoice Settle Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async payInvoice(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const invoiceId = req.params.id;
      
      const result = await ProcurementService.payInvoice(invoiceId, tenantId);
      res.json(result);
    } catch (err) {
      console.error('❌ [Invoice Pay Error]:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async processGRN(req, res) {
    try {
      const { tenantId, role } = req.userContext || {};
      const { supplier_id, po_id, items } = req.body;
      
      console.log(`🚚 [GRN] Processing receipt for PO: ${po_id}, Items: ${items?.length}`);

      const result = await ProcurementService.processGRN(supplier_id, po_id, items, tenantId, role);
      res.json({ ...result, status: 'processed' });
    } catch (err) {
      console.error('🚨 [GRN FATAL ERROR]:', err);
      res.status(500).json({ error: err.message, detail: err });
    }
  }

  async getConversions(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const result = await ProcurementService.getConversions(tenantId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getSuppliers(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const result = await ProcurementService.getSuppliers(tenantId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async createSupplier(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const result = await ProcurementService.createSupplier(req.body, tenantId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new ProcurementController();

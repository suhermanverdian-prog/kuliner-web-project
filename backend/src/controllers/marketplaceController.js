const TransactionService = require('../services/transactionService');

class MarketplaceController {
  
  async webhook(req, res) {
    const { 
      source,
      external_order_id,
      items,
      total,
      customer_name,
      tenant_id,
      outlet_id
    } = req.body;

    try {
      if (!tenant_id) return res.status(400).json({ error: 'Tenant ID required' });

      console.log(`📥 [Omnichannel] Processing ${source} Order: ${external_order_id}`);

      const result = await TransactionService.processGlobalTransaction({
        tenantId: tenant_id,
        outletId: outlet_id,
        source: source || 'Marketplace',
        isMarketplace: true,
        payload: {
          items,
          total,
          customer_name: customer_name || `${source} Order`,
          payment_method: 'Digital Balance'
        }
      });

      res.status(201).json({ 
        success: true, 
        message: 'Pesanan tersinkronisasi, stok terpotong, & jurnal tercatat.',
        order_number: result.orderNumber 
      });

    } catch (err) {
      console.error('❌ Omnichannel Sync Error:', err.message);
      res.status(500).json({ error: 'Gagal sinkronisasi omnichannel: ' + err.message });
    }
  }

}

module.exports = new MarketplaceController();

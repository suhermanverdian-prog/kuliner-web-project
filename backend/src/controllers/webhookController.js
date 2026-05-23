const WebhookService = require('../services/webhookService');

class WebhookController {
  
  async simulatePayment(req, res) {
    try {
      const { transactionId } = req.body;
      const tenantId = req.headers['x-tenant-id'];
      
      const result = await WebhookService.simulatePayment(transactionId, tenantId);
      res.json(result);
    } catch (err) {
      if (err.message === 'Transaksi tidak ditemukan') {
        res.status(404).json({ error: err.message });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  }

}

module.exports = new WebhookController();

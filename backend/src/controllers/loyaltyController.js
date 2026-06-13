const LoyaltyService = require('../services/loyaltyService');
const AppError = require('../utils/AppError');

class LoyaltyController {
  async earn(req, res) {
    const tenantId = req.userContext?.tenantId;
    const { customer_phone, customer_name, amount } = req.body;

    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant ID required' });
    }
    if (!customer_phone) {
      return res.status(400).json({ error: 'Nomor telepon wajib disertakan' });
    }
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Jumlah nominal transaksi wajib disertakan' });
    }

    try {
      const result = await LoyaltyService.earnPoints(tenantId, customer_phone, customer_name, Number(amount));
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }

  async getMe(req, res) {
    const tenantId = req.userContext?.tenantId;
    // Can fetch using logged-in user phone or passed phone param
    const phone = req.query.phone || req.userContext?.userId; // Fallback or direct check

    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant ID required' });
    }
    if (!phone) {
      return res.status(400).json({ error: 'Nomor telepon atau user ID wajib disertakan' });
    }

    try {
      const data = await LoyaltyService.getCustomerData(tenantId, phone);
      res.json(data);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}

module.exports = new LoyaltyController();

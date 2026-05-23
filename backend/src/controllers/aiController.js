const AIService = require('../services/aiService');

class AIController {
  
  async chat(req, res) {
    try {
      const { message, user, apiKey, provider } = req.body;
      const tenantId = user?.tenant_id || (req.userContext && req.userContext.tenantId);
      
      const result = await AIService.processChat(tenantId, message, user, apiKey, provider);
      res.json(result);
    } catch (err) {
      console.error('❌ AI_CHAT_ERROR:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getInsights(req, res) {
    try {
      const { provider, apiKey } = req.query;
      const { tenantId } = req.userContext || {};
      
      const result = await AIService.generateInsights(tenantId, provider, apiKey);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
  async getPricingSuggestions(req, res) {
    try {
      const { provider, apiKey } = req.query;
      const { tenantId } = req.userContext || {};
      
      const result = await AIService.generatePricingModel(tenantId, provider, apiKey);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getInventoryForecast(req, res) {
    try {
      const { provider, apiKey } = req.query;
      const { tenantId } = req.userContext || {};
      
      const result = await AIService.generateDemandForecast(tenantId, provider, apiKey);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new AIController();

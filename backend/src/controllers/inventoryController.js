const InventoryService = require('../services/inventoryService');

class InventoryController {
  
  async getPredictions(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const predictions = await InventoryService.getStockPredictions(tenantId);
      res.json(predictions || []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getWaste(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const waste = await InventoryService.getWastePredictions(tenantId);
      res.json(waste || []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async createWaste(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { bahanId, qty, reason } = req.body;
      const data = await InventoryService.createWaste(bahanId, qty, reason, tenantId);
      res.status(201).json(data);
    } catch (err) {
      console.error('❌ [Inventory POST Waste Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getLogistics(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const logistics = await InventoryService.getLogisticsStatus(tenantId);
      res.json(logistics || []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getLowStock(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const lowStock = await InventoryService.getLowStock(tenantId);
      res.json(lowStock);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getLogs(req, res) {
    try {
      const userContext = req.userContext || {};
      const { startDate, endDate, type, search, limit } = req.query;
      const logs = await InventoryService.getLogs(userContext, { startDate, endDate, type, search, limit });
      res.json(logs);
    } catch (err) {
      console.error('❌ Inventory Logs Error:', err.message);
      res.json([]);
    }
  }

  async getMeta(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const meta = await InventoryService.getMetadata(tenantId);
      res.json(meta);
    } catch (err) {
      res.json({ categories: [], units: [] });
    }
  }

  async getInventory(req, res) {
    try {
      const { tenantId, role } = req.userContext || {};
      const data = await InventoryService.getAllInventory(tenantId, role);
      res.json(data);
    } catch (err) {
      console.error('❌ [Inventory GET Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async createInventory(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { conversions, ...bahanData } = req.body;
      const data = await InventoryService.createInventory(bahanData, conversions, tenantId);
      res.status(201).json(data);
    } catch (err) {
      console.error('❌ [Inventory POST Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async updateInventory(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { id } = req.params;
      const { conversions, ...updateData } = req.body;
      const data = await InventoryService.updateInventory(id, updateData, conversions, tenantId);
      res.json(data);
    } catch (err) {
      console.error('❌ [Inventory PUT Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }


  async deleteInventory(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { id } = req.params;
      const data = await InventoryService.deleteInventory(id, tenantId);
      res.json({ success: true, message: 'Berhasil dihapus (soft-delete)' });
    } catch (err) {
      console.error('❌ [Inventory DELETE Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getCategories(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const data = await InventoryService.getCategories(tenantId);
      res.json(data);
    } catch (err) {
      console.error('❌ [Categories GET Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async createCategory(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { name } = req.body;
      const data = await InventoryService.createCategory(name, tenantId);
      res.status(201).json(data);
    } catch (err) {
      console.error('❌ [Category POST Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteCategory(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { id } = req.params;
      const data = await InventoryService.deleteCategory(id, tenantId);
      res.json({ success: true, data });
    } catch (err) {
      console.error('❌ [Category DELETE Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async assembleInventory(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { targetBahanId, produceQty } = req.body;
      const data = await InventoryService.assembleInventory(targetBahanId, produceQty, tenantId);
      res.status(201).json(data);
    } catch (err) {
      console.error('❌ [Assembly POST Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getWarehouses(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const data = await InventoryService.getWarehouses(tenantId);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async createWarehouse(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const data = await InventoryService.createWarehouse(req.body, tenantId);
      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteWarehouse(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { id } = req.params;
      const result = await InventoryService.deleteWarehouse(id, tenantId);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async executeTransfer(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const data = await InventoryService.executeStockTransfer(req.body, tenantId);
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new InventoryController();

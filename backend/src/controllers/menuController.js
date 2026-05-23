const MenuService = require('../services/menuService');

class MenuController {
  async getAllMenu(req, res) {
    try {
      const { tenantId, outletId, role } = req.userContext;


      const data = await MenuService.getAllMenu(tenantId, outletId, role);
      res.json(data);
    } catch (err) {
      console.warn('⚠️ [Menu Controller] GET Error:', err.message);
      res.json([]);
    }
  }

  async createMenu(req, res) {
    try {
      const { bom, ...menuData } = req.body;
      const { tenantId, outletId } = req.userContext;

      const newMenu = await MenuService.createMenu(menuData, bom, tenantId, outletId);
      res.status(201).json(newMenu);
    } catch (err) {
      console.error('❌ [Menu Controller] POST Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async updateMenu(req, res) {
    try {
      const { bom, ...menuData } = req.body;
      const menuId = req.params.id;
      const { tenantId, outletId } = req.userContext;

      await MenuService.updateMenu(menuId, menuData, bom, tenantId, outletId);
      res.json({ ok: true, message: 'Menu berhasil diupdate' });
    } catch (err) {
      console.error('❌ [Menu Controller] PUT Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteMenu(req, res) {
    try {
      const menuId = req.params.id;
      const { tenantId, outletId } = req.userContext;

      // Soft-Delete (is_active = false)
      await MenuService.softDeleteMenu(menuId, tenantId, outletId);
      res.json({ ok: true, message: 'Menu berhasil dihapus (soft delete)' });
    } catch (err) {
      console.error('❌ [Menu Controller] DELETE Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new MenuController();

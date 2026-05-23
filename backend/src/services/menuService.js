const MenuRepository = require('../repositories/menuRepository');
const redis = require('../utils/redis');

class MenuService {
  async getAllMenu(tenantId, outletId, role) {
    const [menuData, bomData] = await Promise.all([
      MenuRepository.getMenusByTenant(tenantId, role),
      MenuRepository.getMenuBomsByTenant(tenantId, role)
    ]);

    const combinedData = (menuData || []).map(item => ({
      ...item,
      bom: (bomData || [])
        .filter(b => b.menu_id === item.id)
        .map(b => ({
          bahanId: b.bahan_id,
          qty: b.qty_needed
        }))
    }));
    
    return combinedData;
  }

  async createMenu(menuData, bomDataArray, tenantId, outletId) {
    const finalMenuData = { ...menuData, tenant_id: tenantId };
    const newMenu = await MenuRepository.createMenu(finalMenuData);

    if (bomDataArray && Array.isArray(bomDataArray) && newMenu) {
      const boms = bomDataArray.map(b => ({
        tenant_id: tenantId,
        menu_id: newMenu.id,
        bahan_id: b.bahanId || b.bahan_id,
        qty_needed: Number(b.qty) || 0
      }));
      await MenuRepository.createMenuBom(boms);
    }

    this._invalidateCache(tenantId, outletId);
    return newMenu;
  }

  async updateMenu(menuId, menuData, bomDataArray, tenantId, outletId) {
    await MenuRepository.updateMenu(menuId, tenantId, menuData);

    if (bomDataArray && Array.isArray(bomDataArray)) {
      // Refresh BOM: delete old and insert new
      await MenuRepository.deleteMenuBom(menuId);
      const boms = bomDataArray.map(b => ({
        tenant_id: tenantId,
        menu_id: menuId,
        bahan_id: b.bahanId || b.bahan_id,
        qty_needed: Number(b.qty) || 0
      }));
      await MenuRepository.createMenuBom(boms);
    }

    this._invalidateCache(tenantId, outletId);
    return true;
  }

  async softDeleteMenu(menuId, tenantId, outletId) {
    await MenuRepository.softDeleteMenu(menuId, tenantId);
    this._invalidateCache(tenantId, outletId);
    return true;
  }

  _invalidateCache(tenantId, outletId) {
    const cacheKey = `ken:${tenantId || 'global'}:${outletId || 'main'}:menu`;
    if (redis && typeof redis.del === 'function') {
      redis.del(cacheKey).catch(err => console.warn('Redis Cache Invalidaton Error:', err.message));
    }
  }
}

module.exports = new MenuService();

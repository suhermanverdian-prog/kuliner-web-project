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
    const finalMenuData = {
      name: menuData.name,
      price: Number(menuData.price || 0),
      image: menuData.image || null,
      category: menuData.category || null,
      skip_kds: menuData.skip_kds === true,
      is_active: menuData.is_active !== undefined ? menuData.is_active : true,
      tenant_id: tenantId
    };
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
    const finalMenuData = {
      name: menuData.name,
      price: Number(menuData.price || 0),
      image: menuData.image || null,
      category: menuData.category || null,
      skip_kds: menuData.skip_kds === true,
      is_active: menuData.is_active !== undefined ? menuData.is_active : true
    };
    await MenuRepository.updateMenu(menuId, tenantId, finalMenuData);

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

  async bulkAdjustPrices(adjustments, tenantId, outletId) {
    if (!Array.isArray(adjustments)) return false;
    for (const adj of adjustments) {
      if (!adj.id || !adj.suggested) continue;
      await MenuRepository.updateMenu(adj.id, tenantId, { price: Number(adj.suggested) });
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

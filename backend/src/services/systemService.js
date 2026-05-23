const fs = require('fs');
const path = require('path');
const SystemRepository = require('../repositories/systemRepository');

const dataPath = path.join(__dirname, '../../db/data.json');

function getLocalTables() {
  try {
    if (fs.existsSync(dataPath)) {
      const content = fs.readFileSync(dataPath, 'utf8');
      const parsed = JSON.parse(content);
      return parsed.tables || [];
    }
  } catch (err) {}
  return [];
}

function saveLocalTables(tables) {
  try {
    let parsed = {};
    if (fs.existsSync(dataPath)) {
      const content = fs.readFileSync(dataPath, 'utf8');
      parsed = JSON.parse(content);
    }
    parsed.tables = tables;
    fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf8');
    return true;
  } catch (err) {
    return false;
  }
}

class SystemService {
  
  static async getTables(tenantId) {
    let cloudTables = [];
    try {
      cloudTables = await SystemRepository.getTables(tenantId);
    } catch (e) {
      console.warn('⚠️ Supabase tables GET failed, using local tables only:', e.message);
    }

    const localTables = getLocalTables();
    const merged = [...cloudTables];
    localTables.forEach(lt => {
      if (!merged.some(mt => mt.name === lt.name || mt.id === lt.id)) {
        merged.push(lt);
      }
    });

    return merged;
  }

  static async upsertTable(payload, tenantId) {
    if (!payload.id) payload.id = 'table-' + Date.now();
    try {
      const data = await SystemRepository.upsertTable(payload, tenantId);
      return data[0];
    } catch (e) {
      console.warn('⚠️ System Table Error, falling back to local storage:', e.message);
      const tables = getLocalTables();
      const idx = tables.findIndex(t => t.name === payload.name || t.id === payload.id);
      if (idx >= 0) {
          tables[idx] = { ...tables[idx], ...payload };
      } else {
          tables.push(payload);
      }
      saveLocalTables(tables);
      return payload;
    }
  }

  static async updateTable(id, payload, tenantId) {
    try {
      const data = await SystemRepository.updateTable(id, payload, tenantId);
      if (!data || data.length === 0) {
        throw new Error('Fallback Local');
      }
      return data[0];
    } catch (e) {
      console.warn('⚠️ Supabase tables update failed, falling back to local:', e.message);
      const tables = getLocalTables();
      const idx = tables.findIndex(t => String(t.id) === String(id));
      if (idx >= 0) {
          tables[idx] = { ...tables[idx], ...payload };
          saveLocalTables(tables);
          return tables[idx];
      }
      throw new Error('Terjadi kegagalan sistem saat memperbarui data meja.');
    }
  }

  static async deleteTable(id, tenantId) {
    try {
      await SystemRepository.deleteTable(id, tenantId);
      const tables = getLocalTables();
      const filtered = tables.filter(t => String(t.id) !== String(id));
      saveLocalTables(filtered);
      return true;
    } catch (e) {
      const tables = getLocalTables();
      const filtered = tables.filter(t => String(t.id) !== String(id));
      saveLocalTables(filtered);
      return true;
    }
  }

  static async getOutlets(tenantId, role) {
    return await SystemRepository.getOutlets(tenantId, role);
  }

  static async createOutlet(payload, tenantId) {
    payload.tenant_id = tenantId;
    if (payload.is_active === undefined) payload.is_active = true;
    const data = await SystemRepository.createOutlet(payload);
    return data[0];
  }

  static async updateOutlet(id, payload, tenantId, role) {
    const data = await SystemRepository.updateOutlet(id, payload, tenantId, role);
    if (!data || data.length === 0) {
      throw new Error('Outlet tidak ditemukan atau Anda tidak memiliki akses.');
    }
    return data[0];
  }

  static async deleteOutlet(id, tenantId, role) {
    try {
      await SystemRepository.deleteOutlet(id, tenantId, role);
      return { success: true, message: 'Outlet berhasil dihapus secara fisik.' };
    } catch (e) {
      if (e.code === '23503' || e.message.includes('foreign key')) {
        await SystemRepository.updateOutlet(id, { is_active: false }, tenantId, role);
        return { 
          success: true, 
          message: 'Outlet tidak dapat dihapus secara fisik karena memiliki relasi sejarah transaksi. Status operasional dinonaktifkan secara otomatis (Soft-Delete).' 
        };
      }
      throw e;
    }
  }

  static async getOutletInfo(tenantId, outletId) {
    if (outletId) {
      const { data } = await SystemRepository.getOutletInfo(outletId);
      if (data && (data.latitude || data.geofence_radius)) {
        return {
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          geofence_radius: data.geofence_radius || 100,
          store_name: data.name
        };
      }
    }

    const { data: settingsData } = await SystemRepository.getSettings(tenantId);
    return settingsData || { 
      latitude: 0, 
      longitude: 0, 
      geofence_radius: 100, 
      store_name: 'KEN Enterprise Node' 
    };
  }

  static async getSettings(tenantId) {
    const { data } = await SystemRepository.getSettings(tenantId);
    if (data) {
      return {
        id: data.id,
        tenant_id: data.tenant_id,
        storeName: data.store_name,
        store_name: data.store_name,
        taxPct: data.tax,
        tax: data.tax,
        servicePct: data.service_charge,
        service_charge: data.service_charge,
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        radius: data.geofence_radius || 100,
        geofence_radius: data.geofence_radius || 100,
        ai_provider: data.ai_provider,
        ai_api_key: data.ai_api_key,
        is_ai_enabled: data.is_ai_enabled
      };
    }

    return {
      storeName: 'KEN Enterprise Node',
      store_name: 'KEN Enterprise Node',
      taxPct: 0,
      tax: 0,
      servicePct: 0,
      service_charge: 0,
      latitude: 0,
      longitude: 0,
      radius: 100,
      geofence_radius: 100,
      is_ai_enabled: false
    };
  }

  static async getLoyaltySettings(tenantId) {
    const { data } = await SystemRepository.getLoyaltySettings(tenantId);
    if (data) {
      return {
        id: data.id,
        tenant_id: data.tenant_id,
        enabled: data.enabled,
        multiplier: data.multiplier || 1,
        pointsValue: data.points_value || 100,
        points_value: data.points_value || 100
      };
    }

    return {
      enabled: false,
      multiplier: 1,
      pointsValue: 100,
      points_value: 100
    };
  }

  static async upsertSettings(payload, tenantId) {
    payload.tenant_id = tenantId;
    const { data: existing } = await SystemRepository.getSettings(tenantId);
    const existingId = existing?.id;
    const data = await SystemRepository.upsertSettings(payload, existingId);
    return data[0];
  }

  static async upsertLoyaltySettings(payload, tenantId) {
    payload.tenant_id = tenantId;
    const { data: existing } = await SystemRepository.getLoyaltySettings(tenantId);
    const existingId = existing?.id;
    const data = await SystemRepository.upsertLoyaltySettings(payload, existingId);
    return data[0];
  }

  static async getActivityLogs(tenantId, role) {
    return await SystemRepository.getActivityLogs(tenantId, role);
  }
}

module.exports = SystemService;

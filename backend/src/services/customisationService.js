// backend/src/services/customisationService.js
/*
  Customisation Service
  -------------------
  Provides CRUD operations for key/value configuration settings scoped to a tenant
  and optionally an outlet. Stored in Supabase table `customisations` with columns:
    - id (uuid primary key)
    - tenant_id (uuid, NOT NULL)
    - outlet_id (uuid, nullable)   // NULL = tenant‑wide default
    - key (text, NOT NULL)
    - value (jsonb, NOT NULL)
    - created_at, updated_at (timestamps)
*/

const { supabase } = require('../supabase');
const { randomUUID } = require('crypto');

class CustomisationService {
  /** Get merged customisations for a tenant (and optional outlet). */
  static async getAll(tenantId, outletId = null) {
    if (!tenantId) throw new Error('tenantId is required');

    // Tenant‑wide defaults (outlet_id IS NULL)
    const { data: tenantRows, error: tenantErr } = await supabase
      .from('customisations')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('outlet_id', null);
    if (tenantErr) throw tenantErr;

    // Outlet overrides (if outletId supplied)
    let outletRows = [];
    if (outletId) {
      const { data, error } = await supabase
        .from('customisations')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('outlet_id', outletId);
      if (error) throw error;
      outletRows = data;
    }

    // Merge – outlet values override tenant defaults
    const map = {};
    tenantRows?.forEach(r => (map[r.key] = r.value));
    outletRows?.forEach(r => (map[r.key] = r.value));
    return map;
  }

  /** Retrieve a single key with outlet fallback to tenant. */
  static async get(key, tenantId, outletId = null) {
    if (!key) throw new Error('key is required');
    // Try outlet first
    if (outletId) {
      const { data, error } = await supabase
        .from('customisations')
        .select('value')
        .eq('tenant_id', tenantId)
        .eq('outlet_id', outletId)
        .eq('key', key)
        .maybeSingle();
      if (error) throw error;
      if (data) return data.value;
    }
    // Fallback to tenant‑wide
    const { data, error } = await supabase
      .from('customisations')
      .select('value')
      .eq('tenant_id', tenantId)
      .is('outlet_id', null)
      .eq('key', key)
      .maybeSingle();
    if (error) throw error;
    return data ? data.value : null;
  }

  /** Upsert a key/value pair for tenant/outlet. */
  static async set(key, value, tenantId, outletId = null) {
    if (!key) throw new Error('key is required');
    if (value === undefined) throw new Error('value cannot be undefined');
    if (!tenantId) throw new Error('tenantId is required');
    // Normalize value to a canonical shape before saving
    const normalizeValue = (k, v) => {
      if (v === null || v === undefined) return v;
      try {
        // sizes, extras, milks -> ensure object with array property
        if (k === 'sizes') return { sizes: Array.isArray(v) ? v : (v.sizes || v) };
        if (k === 'extras') return { extras: Array.isArray(v) ? v : (v.extras || v) };
        if (k === 'milks') return { milks: Array.isArray(v) ? v : (v.milks || v) };
        // doses: support number, array or object
        if (k === 'doses') {
          if (typeof v === 'number') return { doses: { espresso: v } };
          if (Array.isArray(v)) return { doses: { espresso: v[0] } };
          if (v.espresso !== undefined) return { doses: v };
          return { doses: v };
        }
        // fallback: if array provided, wrap as items
        if (Array.isArray(v)) return { items: v };
        return v;
      } catch (err) {
        return v;
      }
    };

    const normalized = normalizeValue(key, value);

    const payload = {
      id: randomUUID(),
      tenant_id: tenantId,
      outlet_id: outletId,
      key,
      value: normalized,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase
      .from('customisations')
      .upsert(payload, { onConflict: ['tenant_id', 'outlet_id', 'key'] });
    if (error) throw error;
    return true;
  }

  /** Delete a setting */
  static async delete(key, tenantId, outletId = null) {
    if (!key) throw new Error('key is required');
    if (!tenantId) throw new Error('tenantId is required');
    const query = supabase
      .from('customisations')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('key', key);
    if (outletId) query.eq('outlet_id', outletId);
    else query.is('outlet_id', null);
    const { error } = await query;
    if (error) throw error;
    return true;
  }
}

module.exports = CustomisationService;

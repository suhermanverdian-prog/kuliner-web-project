const { supabase } = require('../supabase');
const cache = require('../utils/cache');

const TIER_DEFAULTS = {
  lite: {
    pos: true, kds: true, table_management: true, guest_ordering: true, inventory: true, shift: true,
    recipe_bom: false, waste_management: false, procurement: false, reporting_pdf: true, reporting_excel: false,
    crm: false, loyalty: false, accounting: false, multi_outlet: false, hq_dashboard: false, stock_transfer: false,
    white_label: false, api_access: false, ai_insights: false, omnichannel: false, hrd: false,
  },
  pro: {
    pos: true, kds: true, table_management: true, guest_ordering: true, inventory: true, shift: true,
    recipe_bom: true, waste_management: true, procurement: true, reporting_pdf: true, reporting_excel: true,
    crm: true, loyalty: true, accounting: false, multi_outlet: false, hq_dashboard: false, stock_transfer: false,
    white_label: false, api_access: false, ai_insights: false, omnichannel: true, hrd: false,
  },
  enterprise: {
    pos: true, kds: true, table_management: true, guest_ordering: true, inventory: true, shift: true,
    recipe_bom: true, waste_management: true, procurement: true, reporting_pdf: true, reporting_excel: true,
    crm: true, loyalty: true, accounting: true, multi_outlet: true, hq_dashboard: true, stock_transfer: true,
    white_label: true, api_access: true, ai_insights: true, omnichannel: true, hrd: true,
  },
};

const resolveFeatures = (tenant) => {
  const tier = tenant?.tier || 'lite';
  const defaults = TIER_DEFAULTS[tier] || TIER_DEFAULTS.lite;
  const overrides = tenant?.feature_overrides || {};

  const resolved = {};
  for (const key of Object.keys(TIER_DEFAULTS.enterprise)) {
    if (key in overrides) {
      resolved[key] = overrides[key];
    } else {
      resolved[key] = defaults[key] ?? false;
    }
  }
  return resolved;
};

const requireFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      const { role, tenantId } = req.userContext || {};
      
      // Superadmin bypass
      if (role === 'superadmin') return next();

      if (!tenantId) return res.status(403).json({ error: 'Akses ditolak: Tenant ID tidak valid' });

      // Check cache first, or fetch from DB
      const cacheKey = `tenant_tier_${tenantId}`;
      let tenant = cache.get(cacheKey);
      
      if (!tenant) {
        const { data, error } = await supabase.from('tenants').select('tier, feature_overrides').eq('id', tenantId).single();
        if (error || !data) return res.status(403).json({ error: 'Akses ditolak: Tenant tidak ditemukan atau ID tidak valid' });
        tenant = data;
        cache.set(cacheKey, tenant, 600); // 10 min TTL
      }

      const features = resolveFeatures(tenant);
      if (!features[featureKey]) {
        return res.status(403).json({ error: `Akses ditolak: Fitur ${featureKey} tidak aktif untuk paket langganan Anda.` });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { requireFeature, resolveFeatures };

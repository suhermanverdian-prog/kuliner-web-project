// backend/src/controllers/customisationController.js
/**
 * Controller for POS customisation settings (key/value per tenant/outlet).
 * Uses CustomisationService which talks to Supabase.
 */
const CustomisationService = require('../services/customisationService');

/** GET /api/customisations
 * Returns all merged settings for the current tenant (and outlet if provided).
 */
async function getCustomisations(req, res) {
  try {
    const tenantId = req.userContext?.tenantId || req.user?.tenantId;
    const outletId = req.userContext?.outletId || req.user?.outletId || null;
    if (!tenantId) return res.status(400).json({ error: 'tenantId missing' });
    const data = await CustomisationService.getAll(tenantId, outletId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Customisation GET error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}

/** POST /api/customisations
 * Body: { key: string, value: any }
 * Upserts a single setting for the current tenant/outlet.
 */
async function upsertCustomisation(req, res) {
  try {
      // Accept tenant/outlet from authenticated user, headers, or request body for robustness
    const { key, value } = req.body || {};
    const tenantId = req.userContext?.tenantId || req.user?.tenantId || req.headers['x-tenant-id'] || req.body?.tenantId;
    const outletId = req.userContext?.outletId || req.user?.outletId || req.headers['x-outlet-id'] || req.body?.outletId || null;

    console.log('[Customisation POST] Received:', { key, tenantId, outletId, valueType: typeof value, valueLength: value ? JSON.stringify(value).length : 0 });

    if (!tenantId) {
      console.warn('Customisation POST missing tenantId; headers/body/user not provided', { 
        userContext: req.userContext, 
        headers: req.headers 
      });
      return res.status(400).json({ error: 'tenantId missing' });
    }
    if (!key) {
      console.warn('Customisation POST missing key');
      return res.status(400).json({ error: 'key is required' });
    }

    try {
      console.log('[CustomisationService] Attempting to save:', { key, tenantId, outletId });
      await CustomisationService.set(key, value, tenantId, outletId);
      console.log('[CustomisationService] Save successful for key:', key);
    } catch (err) {
      console.error('CustomisationService.set error:', err.message || err);
      return res.status(500).json({ error: err.message || 'Failed to upsert customisation' });
    }

    // Return refreshed map for convenience
    try {
      const data = await CustomisationService.getAll(tenantId, outletId);
      console.log('[Customisation POST] Returning updated data with keys:', Object.keys(data || {}));
      return res.json({ success: true, data });
    } catch (err) {
      console.error('CustomisationService.getAll error:', err.message || err);
      return res.status(500).json({ error: 'Saved but failed to retrieve updated customisations' });
    }
  } catch (err) {
    console.error('Customisation POST error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}

module.exports = { getCustomisations, upsertCustomisation };

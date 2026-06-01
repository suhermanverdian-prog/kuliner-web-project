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
    const tenantId = req.user?.tenantId;
    const outletId = req.user?.outletId || null; // may be undefined
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
    const { key, value } = req.body;
    const tenantId = req.user?.tenantId;
    const outletId = req.user?.outletId || null;
    if (!tenantId) return res.status(400).json({ error: 'tenantId missing' });
    if (!key) return res.status(400).json({ error: 'key is required' });
    await CustomisationService.set(key, value, tenantId, outletId);
    // Return refreshed map for convenience
    const data = await CustomisationService.getAll(tenantId, outletId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Customisation POST error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}

module.exports = { getCustomisations, upsertCustomisation };

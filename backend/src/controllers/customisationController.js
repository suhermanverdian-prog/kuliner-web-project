// backend/src/controllers/customisationController.js

/**
 * Controller for POS customisation settings (key/value per tenant/outlet).
 * Uses CustomisationService which talks to Supabase.
 */
const CustomisationService = require('../services/customisationService');
const { emitCustomisationUpdate } = require('../utils/realtimeNotifier');

/** GET /api/customisations
 * Returns all merged settings for the current tenant (and outlet if provided).
 */
async function getCustomisations(req, res) {
  try {
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(__dirname, '../../debug.log');
    const logMsg = `[${new Date().toISOString()}] GET Headers: ${JSON.stringify(req.headers)}\nGET userContext: ${JSON.stringify(req.userContext || null)}\n\n`;
    fs.appendFileSync(logPath, logMsg, 'utf8');

    const tenantId = req.userContext?.tenantId || req.headers['x-tenant-id'];
    const outletId = req.userContext?.outletId || req.headers['x-outlet-id'] || null;
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
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(__dirname, '../../debug.log');
    const logMsg = `[${new Date().toISOString()}] POST Body: ${JSON.stringify(req.body)}\nPOST Headers: ${JSON.stringify(req.headers)}\nPOST userContext: ${JSON.stringify(req.userContext || null)}\n\n`;
    fs.appendFileSync(logPath, logMsg, 'utf8');

    const tenantId = req.userContext?.tenantId || req.headers['x-tenant-id'];
    const outletId = req.userContext?.outletId || req.headers['x-outlet-id'] || null;
    if (!tenantId) return res.status(400).json({ error: 'tenantId missing' });
    if (!key) return res.status(400).json({ error: 'key is required' });
    await CustomisationService.set(key, value, tenantId, outletId);
    // Emit realtime notification for KDS and other listeners
    emitCustomisationUpdate(tenantId, outletId, key, value);
    // Return refreshed map for convenience
    const data = await CustomisationService.getAll(tenantId, outletId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Customisation POST error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}

module.exports = { getCustomisations, upsertCustomisation };

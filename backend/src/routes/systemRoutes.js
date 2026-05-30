const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { validateBody } = require('../middleware/validate');
const systemController = require('../controllers/systemController');

// ============================================================
// VALIDATION SCHEMAS (ZOD SETTINGS HARDENING)
// ============================================================
const settingsSchema = z.object({
  store_name: z.string().min(1, 'Nama outlet wajib diisi'),
  tax: z.number().min(0).max(100),
  service_charge: z.number().min(0).max(100).optional().default(0),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  geofence_radius: z.number().nonnegative().optional().default(100),
  radius: z.number().nonnegative().optional(),
  ai_provider: z.string().optional().nullable(),
  ai_api_key: z.string().optional().nullable(),
  is_ai_enabled: z.boolean().optional().nullable(),
  void_approvers: z.array(z.string()).optional().nullable()
}).passthrough();

const loyaltySettingsSchema = z.object({
  enabled: z.boolean(),
  multiplier: z.number().nonnegative(),
  points_value: z.number().nonnegative()
});
// ============================================================

/**
 * @route GET /api/tables
 */
router.get('/tables', systemController.getTables);

/**
 * @route GET /api/locations
 * @desc Alias for outlets
 */
router.get('/locations', systemController.getOutlets);

/**
 * @route POST /api/tables
 */
router.post('/tables', systemController.upsertTable);

/**
 * @route PUT /api/tables/:id
 */
router.put('/tables/:id', systemController.updateTable);

/**
 * @route DELETE /api/tables/:id
 */
router.delete('/tables/:id', systemController.deleteTable);

/**
 * @route GET /api/system-logs
 */
router.get('/system-logs', systemController.getActivityLogs);

/**
 * @route GET /api/outletinfos
 * Menyediakan informasi geofence dan koordinat outlet.
 */
router.get('/outletinfos', systemController.getOutletInfo);

/**
 * @route GET /api/system/settings
 */
router.get('/settings', systemController.getSettings);

/**
 * @route GET /api/system/settings/loyalty
 */
router.get('/settings/loyalty', systemController.getLoyaltySettings);

/**
 * @route POST /api/settings
 */
router.post('/settings', validateBody(settingsSchema), systemController.upsertSettings);

/**
 * @route POST /api/settings/loyalty
 */
router.post('/settings/loyalty', validateBody(loyaltySettingsSchema), systemController.upsertLoyaltySettings);

/**
 * @route GET /api/system/outlets
 */
router.get('/outlets', systemController.getOutlets);

/**
 * @route POST /api/system/outlets
 */
router.post('/outlets', systemController.createOutlet);

/**
 * @route PUT /api/system/outlets/:id
 */
router.put('/outlets/:id', systemController.updateOutlet);

/**
 * @route DELETE /api/system/outlets/:id
 */
router.delete('/outlets/:id', systemController.deleteOutlet);

/**
 * @route GET /api/system/integrity
 * @desc Run cryptographic tamper audit on all audit logs — OWNER ONLY
 */
router.get('/integrity', systemController.verifySystemIntegrity);

module.exports = router;

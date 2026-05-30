const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { validateBody } = require('../middleware/validate');
const permissionGuard = require('../middleware/permissionGuard');
const opnameController = require('../controllers/opnameController');
const opnameAccountingController = require('../controllers/opnameAccountingController');
const OpnameScheduler = require('../services/opnameScheduler');

// ====================================================================
// Zod Validation Schemas (SCBD Grade Enterprise Standards)
// ====================================================================
const startOpnameSchema = z.object({
  outletId: z.string().uuid('Outlet ID harus berupa UUID valid'),
  type: z.enum(['blind', 'standard']).optional().default('blind'),
  notes: z.string().optional()
});

const recordCountSchema = z.object({
  itemId: z.union([z.string(), z.number()]),
  stockFisik: z.number().nonnegative('Jumlah fisik tidak boleh negatif'),
  notes: z.string().optional()
});

const createScheduleSchema = z.object({
  outletId: z.string().uuid('Outlet ID harus berupa UUID'),
  opnameType: z.enum(['blind', 'standard']).optional().default('blind'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  scheduled_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu harus HH:MM'),
  timezone: z.string().optional().default('Asia/Jakarta'),
  enabled: z.boolean().optional().default(true)
});

/**
 * @route GET /api/opname
 * @desc Get all opname sessions
 */
router.get('/', permissionGuard('inventory', 'view'), opnameController.getSessions);

/**
 * @route GET /api/opname/outlet/:outletId/summary
 * @desc Get statistical summary of audits by outlet
 */
router.get('/outlet/:outletId/summary', permissionGuard('inventory', 'view'), opnameController.getOutletSummary);

/**
 * @route GET /api/opname/accounting/templates
 * @desc Get all active journal templates
 */
router.get('/accounting/templates', permissionGuard('accounting', 'view'), opnameAccountingController.getTemplates);

/**
 * @route POST /api/opname/accounting/templates
 * @desc Create a new GL mapping template
 */
router.post('/accounting/templates', permissionGuard('accounting', 'create'), opnameAccountingController.createTemplate);

/**
 * @route GET /api/opname/accounting/reconciliation
 * @desc Get General Ledger reconciliation report
 */
router.get('/accounting/reconciliation', permissionGuard('accounting', 'view'), opnameAccountingController.getReconciliation);

/**
 * @route GET /api/opname/schedules
 * @desc Get all scheduled opnames
 */
router.get('/schedules', permissionGuard('inventory', 'view'), async (req, res) => {
  try {
    const { tenantId } = req.userContext || {};
    const schedules = await OpnameScheduler.getSchedules(tenantId);
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route POST /api/opname/schedules
 * @desc Create a new scheduled opname
 */
router.post('/schedules', permissionGuard('inventory', 'create'), validateBody(createScheduleSchema), async (req, res) => {
  try {
    const { tenantId, id: userId } = req.userContext || {};
    const schedule = await OpnameScheduler.createSchedule(tenantId, userId, req.body);
    res.status(201).json(schedule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @route PUT /api/opname/schedules/:scheduleId
 * @desc Update a scheduled opname
 */
router.put('/schedules/:scheduleId', permissionGuard('inventory', 'update'), async (req, res) => {
  try {
    const { tenantId } = req.userContext || {};
    const { scheduleId } = req.params;
    const schedule = await OpnameScheduler.updateSchedule(scheduleId, tenantId, req.body);
    res.json(schedule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @route DELETE /api/opname/schedules/:scheduleId
 * @desc Soft-delete a scheduled opname
 */
router.delete('/schedules/:scheduleId', permissionGuard('inventory', 'delete'), async (req, res) => {
  try {
    const { tenantId } = req.userContext || {};
    const { scheduleId } = req.params;
    const result = await OpnameScheduler.deleteSchedule(scheduleId, tenantId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @route GET /api/opname/schedules/:scheduleId/history
 * @desc Get execution history of a schedule
 */
router.get('/schedules/:scheduleId/history', permissionGuard('inventory', 'view'), async (req, res) => {
  try {
    const { tenantId } = req.userContext || {};
    const { scheduleId } = req.params;
    const history = await OpnameScheduler.getScheduleHistory(scheduleId, tenantId);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /api/opname/:id
 * @desc Get details of an opname session including items
 */
router.get('/:id', permissionGuard('inventory', 'view'), opnameController.getSessionById);

/**
 * @route POST /api/opname
 * @desc Start a new opname session
 */
router.post('/', permissionGuard('inventory', 'create'), validateBody(startOpnameSchema), opnameController.startOpname);

/**
 * @route POST /api/opname/:sessionId/record
 * @desc Record a physical count for a single item (counter mode)
 */
router.post('/:sessionId/record', permissionGuard('inventory', 'update'), validateBody(recordCountSchema), opnameController.recordCount);

/**
 * @route POST /api/opname/:sessionId/complete
 * @desc Mark session as completed (counter finished)
 */
router.post('/:sessionId/complete', permissionGuard('inventory', 'update'), opnameController.completeOpname);

/**
 * @route POST /api/opname/:sessionId/approve
 * @desc Approve opname session and commit actual adjustments + journal entry posting (owner/manager only)
 */
router.post('/:sessionId/approve', permissionGuard('inventory', 'update'), opnameController.approveOpname);

/**
 * @route POST /api/opname/:sessionId/cancel
 * @desc Cancel/void an unapproved session
 */
router.post('/:sessionId/cancel', permissionGuard('inventory', 'delete'), opnameController.cancelOpname);

/**
 * @route POST /api/opname/:sessionId/journals/create
 * @desc Preview journal entries for an approved session
 */
router.post('/:sessionId/journals/create', permissionGuard('accounting', 'create'), opnameAccountingController.createJournals);

/**
 * @route POST /api/opname/:sessionId/journals/post
 * @desc Post journal entries to GL
 */
router.post('/:sessionId/journals/post', permissionGuard('accounting', 'create'), opnameAccountingController.postJournals);

module.exports = router;


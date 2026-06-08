const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');

// Define API endpoints for Shifts
router.get('/', shiftController.getAllShifts);
router.post('/', shiftController.openShift);
router.get('/active', shiftController.getActiveShift);
router.get('/:id/audit', shiftController.getShiftAudit);

router.post('/:id/close', shiftController.closeShift);
module.exports = router;

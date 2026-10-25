const shiftService = require('../services/shiftService');

exports.getAllShifts = async (req, res, next) => {
  try {
    const tenantId = req.userContext.tenantId;
    const shifts = await shiftService.getAllShifts(tenantId);
    res.json(shifts);
  } catch (err) {
    next(err);
  }
};

exports.getActiveShift = async (req, res, next) => {
  try {
    const tenantId = req.userContext?.tenantId || req.headers['x-tenant-id'] || '00000000-0000-0000-0000-000000000000';
    const outletId = req.userContext?.outletId || req.query?.outletId || req.query?.outlet_id || req.headers['x-outlet-id'] || null;
    const activeShift = await shiftService.getActiveShift(tenantId, outletId);
    res.json(activeShift);
  } catch (err) {
    next(err);
  }
};

exports.openShift = async (req, res, next) => {
  try {
    const tenantId = req.userContext.tenantId;
    const outletId = req.userContext?.outletId || req.body?.outletId || req.body?.outlet_id || req.headers['x-outlet-id'] || null;
    const newShift = await shiftService.openShift(tenantId, req.body, outletId);
    res.status(201).json({ message: 'Shift berhasil dibuka.', data: newShift });
  } catch (err) {
    next(err);
  }
};

exports.getShiftAudit = async (req, res, next) => {
  try {
    const tenantId = req.userContext.tenantId;
    const shiftId = req.params.id;
    const audit = await shiftService.getShiftAudit(tenantId, shiftId);
    // Ensure response includes status 200
    res.status(200).json(audit);
  } catch (err) {
    next(err);
  }
};

exports.closeShift = async (req, res, next) => {
  try {
    const tenantId = req.userContext.tenantId;
    const shiftId = req.params.id;
    const updatedShift = await shiftService.closeShift(tenantId, shiftId, req.body);
    res.json({ message: 'Shift berhasil ditutup.', data: updatedShift });
  } catch (err) {
    next(err);
  }
};

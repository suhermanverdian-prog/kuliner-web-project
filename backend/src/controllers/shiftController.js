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
    const tenantId = req.userContext.tenantId;
    const activeShift = await shiftService.getActiveShift(tenantId);
    res.json(activeShift);
  } catch (err) {
    next(err);
  }
};

exports.openShift = async (req, res, next) => {
  try {
    const tenantId = req.userContext.tenantId;
    const newShift = await shiftService.openShift(tenantId, req.body);
    res.status(201).json({ message: 'Shift berhasil dibuka.', data: newShift });
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

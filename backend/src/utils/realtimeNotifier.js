// utils/realtimeNotifier.js

// Existing order update emitter
const emitOrderUpdate = (orderId, payload) => {
  // Retrieve Socket.IO instance from the Express app (set in server.js)
  const io = require('../server').getIo?.();
  if (!io) {
    console.warn('⚠️ Socket.io instance not available. Skipping realtime emit.');
    return;
  }
  // Emit to a dedicated namespace for order updates
  io.of('/orders').emit('order:update', { orderId, ...payload });
};

// New customisation update emitter for KDS awareness
const emitCustomisationUpdate = (tenantId, outletId, key, value) => {
  const io = require('../server').getIo?.();
  if (!io) {
    console.warn('⚠️ Socket.io instance not available. Skipping customisation emit.');
    return;
  }
  // Emit to a dedicated namespace for customisation updates
  io.of('/customisations').emit('customisation:update', { tenantId, outletId, key, value });
};

module.exports = { emitOrderUpdate, emitCustomisationUpdate };

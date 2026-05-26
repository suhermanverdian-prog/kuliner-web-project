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

module.exports = { emitOrderUpdate };

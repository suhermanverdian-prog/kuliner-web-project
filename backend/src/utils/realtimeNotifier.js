// backend/src/utils/realtimeNotifier.js
const { supabase } = require('../supabase');

let channel = null;
let subscriptionPromise = null;

function getRealtimeChannel() {
  if (channel && subscriptionPromise) {
    return subscriptionPromise;
  }
  channel = supabase.channel('realtime');
  subscriptionPromise = new Promise((resolve) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ [RealTime] Supabase channel subscribed for broadcasting.');
        resolve(channel);
      }
    });
    // Fallback timeout in case subscription takes longer or offline
    setTimeout(() => resolve(channel), 2000);
  });
  return subscriptionPromise;
}

const broadcast = async (event, payload) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  try {
    const ch = await getRealtimeChannel();
    await ch.send({
      type: 'broadcast',
      event,
      payload,
      data: payload // Support both payload.data and payload.payload
    });
    console.log(`📡 [Supabase Broadcast] '${event}' sent:`, payload?.id || payload?.order_number || '');
  } catch (err) {
    console.warn(`⚠️ [Supabase Broadcast Error] Event '${event}':`, err.message);
  }
};

/**
 * Emit order status update (for KDS, customer order tracking, and kasir)
 */
const emitOrderUpdate = (orderId, payload = {}) => {
  return broadcast('KDS_UPDATE', { id: orderId, ...payload });
};

/**
 * Emit new transaction (for KDS kitchen display and Kasir notifications)
 */
const emitNewTransaction = (transaction) => {
  return broadcast('NEW_TRANSACTION', transaction);
};

/**
 * Emit shift status change (for Kasir, KDS, and Guest menu status)
 */
const emitShiftUpdate = (shift) => {
  return broadcast('SHIFT_UPDATE', shift);
};

/**
 * Emit customization or menu update
 */
const emitCustomisationUpdate = (tenantId, outletId, key, value) => {
  return broadcast('CUSTOMISATION_UPDATE', { tenantId, outletId, key, value });
};

module.exports = {
  broadcast,
  emitOrderUpdate,
  emitNewTransaction,
  emitShiftUpdate,
  emitCustomisationUpdate
};

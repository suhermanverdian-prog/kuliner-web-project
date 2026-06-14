const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const ChannelFactory = require('../integrations/ChannelFactory');

let connection;
let stockSyncQueue;
let isRedisActive = false;

try {
  connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    connectTimeout: 2000, // Jangan tunggu terlalu lama jika mati
  });

  connection.on('error', (err) => {
    if (isRedisActive) console.warn('⚠️ [Queue] Redis connection lost. Falling back to Direct Sync.');
    isRedisActive = false;
  });

  connection.on('ready', () => {
    console.log('🚀 [Queue] Redis Connected. Background Sync Active.');
    isRedisActive = true;
  });

  stockSyncQueue = new Queue('StockSync', { connection });
} catch (e) {
  console.warn('⚠️ [Queue] Redis initialization failed. Direct Sync mode engaged.');
}

/**
 * @function addStockSyncJob
 * @description Menambahkan tugas sinkronisasi stok ke antrean (atau eksekusi langsung jika Redis mati)
 */
const addStockSyncJob = async (tenantId, channelName, itemCode, newStock) => {
  if (isRedisActive && stockSyncQueue) {
    try {
      await stockSyncQueue.add(`sync-${channelName}-${itemCode}`, {
        tenantId, channelName, itemCode, newStock
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 }
      });
      console.log(`📦 [Queue] Job added: Sync ${itemCode} to ${channelName}`);
      return;
    } catch (e) {
      console.warn('⚠️ [Queue] Failed to add job. Switching to Direct Sync.');
    }
  }

  // FALLBACK: Direct Sync (Enterprise Resilience)
  try {
    console.log(`⚡ [Direct] Syncing ${itemCode} to ${channelName} (Redis Offline)`);
    const channel = ChannelFactory.getChannel(channelName, tenantId);
    await channel.syncStock(itemCode, newStock);
  } catch (err) {
    console.error(`❌ [Direct] Failed to sync ${itemCode}:`, err.message);
  }
};

// Worker initialization wrapped in check
if (connection) {
  try {
    const worker = new Worker('StockSync', async job => {
      const { tenantId, channelName, itemCode, newStock } = job.data;
      const channel = ChannelFactory.getChannel(channelName, tenantId);
      await channel.syncStock(itemCode, newStock);
    }, { connection });

    // Dead Letter Alert (BullMQ DLA Worker Event Listeners)
    // Aturan KEN OS: Logging kegagalan antrean asinkron secara detail ke activity_logs
    const { supabase } = require('../supabase');

    worker.on('failed', async (job, err) => {
      console.error(`🚨 [Queue] Job ${job.id} failed:`, err.message);
      try {
        await supabase.from('activity_logs').insert([{
          tenant_id: job.data.tenantId || '00000000-0000-0000-0000-000000000000',
          user_name: 'BullMQ StockSync Worker',
          role: 'system',
          activity_type: 'QUEUE_FAILED',
          description: `Job ${job.id} (Sync ${job.data.itemCode} -> ${job.data.channelName}) failed after attempts limit: ${err.message}`,
          old_value: job.data,
          new_value: { error: err.message, stack: err.stack },
          created_at: new Date().toISOString()
        }]);
      } catch (logErr) {
        console.error('❌ Failed to log Queue DLA event:', logErr.message);
      }
    });

    worker.on('error', (err) => {
      console.error('🚨 [Queue] Worker internal error:', err.message);
    });

    worker.on('stalled', (jobId) => {
      console.warn(`⚠️ [Queue] Job ${jobId} stalled. It will be retried or marked as failed.`);
    });

  } catch (e) {
    console.error('❌ Failed to initialize BullMQ Worker:', e.message);
  }
}

module.exports = { addStockSyncJob };

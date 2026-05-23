const { createClient } = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.fallbackStore = new Map(); // In-memory fallback if Redis is down
  }

  async connect() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 2000,
          reconnectStrategy: (retries) => {
            if (retries > 3) return new Error('Max retries reached');
            return 5000;
          }
        }
      });

      this.client.on('error', (err) => {
        // Silent warn to avoid terminal flooding if down
        if (this.isReady) console.warn('⚠️ [Redis] Connection Interrupted.');
        this.isReady = false;
      });

      this.client.on('ready', () => {
        console.log('🚀 [Redis] Cache Engine Ready');
        this.isReady = true;
      });

      await this.client.connect().catch(e => {
        console.warn('⚠️ [Redis] Offline. Using In-Memory Fallback.');
      });
    } catch (err) {
      this.isReady = false;
    }
  }

  /**
   * @method checkAndSetIdempotency
   * @description Menjalankan Lua Script untuk cek dan set key secara atomik
   */
  async checkAndSetIdempotency(key, value, ttlSeconds) {
    // 1. Redis Mode (Lua Script)
    if (this.isReady) {
      const luaScript = `
        local val = redis.call('GET', KEYS[1])
        if val then
          return val
        else
          redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
          return nil
        end
      `;
      
      try {
        const result = await this.client.eval(luaScript, {
          keys: [key],
          arguments: [JSON.stringify(value), ttlSeconds.toString()]
        });
        return result ? JSON.parse(result) : null;
      } catch (e) {
        console.error('❌ [Lua Error]:', e.message);
      }
    }

    // 2. Fallback Mode (Emulasi Idempotency)
    const entry = this.fallbackStore.get(key);
    if (entry) {
      if (Date.now() <= entry.expiry) return entry.data;
      this.fallbackStore.delete(key);
    }
    
    // Set baru jika tidak ada / expired
    this.fallbackStore.set(key, {
      data: value,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
    return null;
  }

  async set(key, value, ttlSeconds = 3600) {
    if (this.isReady) {
      try {
        await this.client.set(key, JSON.stringify(value), {
          EX: ttlSeconds
        });
        return;
      } catch (e) {}
    }
    
    // Fallback
    this.fallbackStore.set(key, {
      data: value,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  }

  async get(key) {
    if (this.isReady) {
      try {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      } catch (e) {}
    }

    // Fallback logic
    const entry = this.fallbackStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.fallbackStore.delete(key);
      return null;
    }
    return entry.data;
  }

  async del(key) {
    if (this.isReady) {
      try {
        await this.client.del(key);
      } catch (e) {}
    }
    this.fallbackStore.delete(key);
  }
}

const redisService = new RedisService();
module.exports = redisService;

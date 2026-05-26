const NodeCache = require('node-cache');

// Default cache TTL = 5 minutes (300 seconds)
const localCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

module.exports = {
  get: (key) => localCache.get(key),
  set: (key, value, ttl) => localCache.set(key, value, ttl),
  del: (key) => localCache.del(key),
  flush: () => localCache.flushAll()
};

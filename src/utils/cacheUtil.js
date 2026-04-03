const NodeCache = require("node-cache");

// Initialize local cache layer matching Redis methodology
// stdTTL: standard time to live in seconds (60 seconds)
// checkperiod: period in seconds used for the automatic delete check interval
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

/**
 * Super Fast DB Request Cache Proxy
 * Mirrors production Redis interception logic precisely
 * Generates sub-millisecond API response latency on static routes
 */
class CacheUtil {
  static get(key) {
    return cache.get(key);
  }

  static set(key, data, ttlSeconds = 60) {
    cache.set(key, data, ttlSeconds);
  }

  static clear(key) {
    cache.del(key);
  }

  static clearPattern(prefix) {
    const keys = cache.keys();
    const targets = keys.filter(k => k.startsWith(prefix));
    cache.del(targets);
  }
}

module.exports = CacheUtil;

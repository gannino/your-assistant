/**
 * Model Cache Utility
 *
 * Provides caching functionality for AI provider model lists.
 * Prevents rate limiting (HTTP 429) when frequently fetching models.
 */

/**
 * @typedef {Object} ModelCache
 * @property {Array<string>} models - Cached model names
 * @property {number} timestamp - Cache creation timestamp
 */

/**
 * Default cache duration: 5 minutes
 */
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000;

/**
 * In-memory cache storage (shared across all provider instances)
 * Key: provider name (e.g., 'anthropic', 'gemini')
 * Value: ModelCache
 */
const cacheStore = new Map();

/**
 * Get cached models for a provider
 * @param {string} providerName - Provider identifier (e.g., 'anthropic', 'gemini')
 * @param {number} cacheDuration - Cache duration in milliseconds (default: 5 minutes)
 * @returns {Array<string> | null} Cached models if valid and not expired, null otherwise
 */
export function getCachedModels(providerName, cacheDuration = DEFAULT_CACHE_DURATION) {
  const cache = cacheStore.get(providerName);

  if (!cache) {
    return null;
  }

  const cacheAge = Date.now() - cache.timestamp;

  if (cacheAge < cacheDuration) {
    const ageSeconds = Math.round(cacheAge / 1000);
    console.log(`[${providerName}] Using cached models (${ageSeconds}s old)`);
    return cache.models;
  }

  // Cache expired
  console.log(`[${providerName}] Cache expired, refetching models...`);
  cacheStore.delete(providerName);
  return null;
}

/**
 * Set cached models for a provider
 * @param {string} providerName - Provider identifier
 * @param {Array<string>} models - Model names to cache
 * @returns {void}
 */
export function setCachedModels(providerName, models) {
  if (!Array.isArray(models) || models.length === 0) {
    console.warn(`[${providerName}] Cannot cache empty or invalid model list`);
    return;
  }

  cacheStore.set(providerName, {
    models,
    timestamp: Date.now(),
  });

  console.log(`[${providerName}] ✅ Cached ${models.length} models`);
}

/**
 * Clear cache for a specific provider
 * @param {string} providerName - Provider identifier
 * @returns {boolean} True if cache was cleared, false if no cache existed
 */
export function clearProviderCache(providerName) {
  const existed = cacheStore.has(providerName);
  cacheStore.delete(providerName);
  if (existed) {
    console.log(`[${providerName}] Cache cleared`);
  }
  return existed;
}

/**
 * Clear all cached models (useful for testing or forced refresh)
 * @returns {number} Number of caches cleared
 */
export function clearAllCache() {
  const count = cacheStore.size;
  cacheStore.clear();
  console.log(`[ModelCache] Cleared ${count} provider caches`);
  return count;
}

/**
 * Get cache statistics for debugging
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  const stats = {};
  for (const [providerName, cache] of cacheStore.entries()) {
    const age = Date.now() - cache.timestamp;
    stats[providerName] = {
      modelCount: cache.models.length,
      ageSeconds: Math.round(age / 1000),
      timestamp: new Date(cache.timestamp).toISOString(),
    };
  }
  return stats;
}

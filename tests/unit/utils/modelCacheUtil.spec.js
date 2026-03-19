import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getCachedModels,
  setCachedModels,
  clearProviderCache,
  clearAllCache,
  getCacheStats,
} from '@/utils/modelCacheUtil';

describe('modelCacheUtil', () => {
  beforeEach(() => {
    // Clear all caches before each test
    clearAllCache();
    jest.clearAllMocks();
  });

  describe('setCachedModels', () => {
    it('should cache models successfully', () => {
      const models = ['model-1', 'model-2', 'model-3'];
      setCachedModels('test-provider', models);

      const cached = getCachedModels('test-provider');
      expect(cached).toEqual(models);
    });

    it('should not cache empty arrays', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      setCachedModels('test-provider', []);

      const cached = getCachedModels('test-provider');
      expect(cached).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[test-provider] Cannot cache empty or invalid model list'
      );

      consoleSpy.mockRestore();
    });

    it('should not cache non-array values', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      setCachedModels('test-provider', null);
      setCachedModels('test-provider', 'not-an-array');
      setCachedModels('test-provider', undefined);

      const cached = getCachedModels('test-provider');
      expect(cached).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should update timestamp when caching', () => {
      const before = Date.now();
      setCachedModels('test-provider', ['model-1']);
      const after = Date.now();

      const stats = getCacheStats();
      expect(stats['test-provider']).toBeDefined();

      // Parse the ISO timestamp to compare
      const timestamp = new Date(stats['test-provider'].timestamp).getTime();
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('getCachedModels', () => {
    it('should return null for non-existent cache', () => {
      const cached = getCachedModels('non-existent-provider');
      expect(cached).toBeNull();
    });

    it('should return cached models if not expired', () => {
      const models = ['model-1', 'model-2'];
      setCachedModels('test-provider', models);

      // Should return cached models (default cache duration is 5 minutes)
      const cached = getCachedModels('test-provider');
      expect(cached).toEqual(models);
    });

    it('should return null for expired cache', () => {
      const models = ['model-1', 'model-2'];
      setCachedModels('test-provider', models);

      // Use a very short cache duration to simulate expiration
      const cached = getCachedModels('test-provider', 0);
      expect(cached).toBeNull();
    });

    it('should delete expired cache entries', () => {
      setCachedModels('test-provider', ['model-1']);

      // Force expiration with 0ms cache duration
      getCachedModels('test-provider', 0);

      // Should return null again (cache was deleted)
      const cachedAgain = getCachedModels('test-provider', 0);
      expect(cachedAgain).toBeNull();
    });

    it('should support custom cache durations', () => {
      const models = ['model-1'];
      setCachedModels('test-provider', models);

      // With 10 second cache
      expect(getCachedModels('test-provider', 10000)).toEqual(models);

      // With 0 second cache (expired)
      expect(getCachedModels('test-provider', 0)).toBeNull();
    });
  });

  describe('clearProviderCache', () => {
    it('should clear cache for specific provider', () => {
      setCachedModels('provider-1', ['model-1']);
      setCachedModels('provider-2', ['model-2']);

      const cleared = clearProviderCache('provider-1');

      expect(cleared).toBe(true);
      expect(getCachedModels('provider-1')).toBeNull();
      expect(getCachedModels('provider-2')).toEqual(['model-2']);
    });

    it('should return false for non-existent cache', () => {
      const cleared = clearProviderCache('non-existent-provider');
      expect(cleared).toBe(false);
    });

    it('should allow re-caching after clearing', () => {
      setCachedModels('test-provider', ['model-1']);
      clearProviderCache('test-provider');

      setCachedModels('test-provider', ['model-2']);
      expect(getCachedModels('test-provider')).toEqual(['model-2']);
    });
  });

  describe('clearAllCache', () => {
    it('should clear all provider caches', () => {
      setCachedModels('provider-1', ['model-1']);
      setCachedModels('provider-2', ['model-2']);
      setCachedModels('provider-3', ['model-3']);

      const count = clearAllCache();

      expect(count).toBe(3);
      expect(getCachedModels('provider-1')).toBeNull();
      expect(getCachedModels('provider-2')).toBeNull();
      expect(getCachedModels('provider-3')).toBeNull();
    });

    it('should return 0 when no caches exist', () => {
      const count = clearAllCache();
      expect(count).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    it('should return empty object when no caches exist', () => {
      const stats = getCacheStats();
      expect(stats).toEqual({});
    });

    it('should return stats for all cached providers', () => {
      setCachedModels('provider-1', ['model-1', 'model-2']);
      setCachedModels('provider-2', ['model-3']);

      const stats = getCacheStats();

      expect(stats['provider-1']).toBeDefined();
      expect(stats['provider-1'].modelCount).toBe(2);
      expect(stats['provider-1'].ageSeconds).toBeGreaterThanOrEqual(0);
      expect(stats['provider-1'].timestamp).toBeDefined();

      expect(stats['provider-2']).toBeDefined();
      expect(stats['provider-2'].modelCount).toBe(1);
    });

    it('should include ISO timestamp for each cache', () => {
      setCachedModels('test-provider', ['model-1']);

      const stats = getCacheStats();
      const timestamp = stats['test-provider'].timestamp;

      // ISO 8601 format check
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should track age correctly', async () => {
      setCachedModels('test-provider', ['model-1']);

      const stats1 = getCacheStats();
      expect(stats1['test-provider'].ageSeconds).toBe(0);

      // Wait a bit (at least 1100ms to ensure age > 0)
      await new Promise(resolve => setTimeout(resolve, 1100));

      const stats2 = getCacheStats();
      expect(stats2['test-provider'].ageSeconds).toBeGreaterThan(0);
    });
  });

  describe('multiple providers', () => {
    it('should handle multiple providers independently', () => {
      setCachedModels('openai', ['gpt-3.5-turbo', 'gpt-4']);
      setCachedModels('anthropic', ['claude-3-opus', 'claude-3-sonnet']);
      setCachedModels('google', ['gemini-pro']);

      expect(getCachedModels('openai')).toHaveLength(2);
      expect(getCachedModels('anthropic')).toHaveLength(2);
      expect(getCachedModels('google')).toHaveLength(1);
    });

    it('should allow independent expiration per provider', () => {
      setCachedModels('provider-1', ['model-1']);
      setCachedModels('provider-2', ['model-2']);

      // Expire only provider-1
      getCachedModels('provider-1', 0);

      expect(getCachedModels('provider-1', 0)).toBeNull();
      expect(getCachedModels('provider-2')).toEqual(['model-2']);
    });
  });
});

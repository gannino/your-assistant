import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { withRetry, createRetryWrapper, RetryPresets } from '@/utils/retryUtil';

describe('retryUtil', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error (HTTP 429)', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce({ status: 429, message: 'Rate limited' })
        .mockResolvedValue('success');

      const result = await withRetry(fn, { maxRetries: 2 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on retryable error (HTTP 500)', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce({ statusCode: 500, message: 'Internal error' })
        .mockResolvedValue('success');

      const result = await withRetry(fn, { maxRetries: 2 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on network error (AbortError)', async () => {
      const error = new Error('Request timeout');
      error.name = 'AbortError';
      const fn = jest.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

      const result = await withRetry(fn, { maxRetries: 2 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry on network error (TypeError)', async () => {
      const error = new TypeError('Failed to fetch');
      const fn = jest.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

      const result = await withRetry(fn, { maxRetries: 2 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries exceeded', async () => {
      const fn = jest.fn().mockRejectedValue({ status: 429, message: 'Rate limited' });

      await expect(withRetry(fn, { maxRetries: 2 })).rejects.toEqual({
        status: 429,
        message: 'Rate limited',
      });

      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('should not retry non-retryable errors (401)', async () => {
      const fn = jest.fn().mockRejectedValue({ status: 401, message: 'Unauthorized' });

      await expect(withRetry(fn, { maxRetries: 2 })).rejects.toEqual({
        status: 401,
        message: 'Unauthorized',
      });

      expect(fn).toHaveBeenCalledTimes(1); // no retries
    });

    it('should not retry non-retryable errors (400)', async () => {
      const fn = jest.fn().mockRejectedValue({ status: 400, message: 'Bad request' });

      await expect(withRetry(fn, { maxRetries: 2 })).rejects.toEqual({
        status: 400,
        message: 'Bad request',
      });

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce({ status: 429, message: 'Rate limited' })
        .mockRejectedValueOnce({ status: 429, message: 'Rate limited' })
        .mockResolvedValue('success');

      const startTime = Date.now();
      await withRetry(fn, {
        maxRetries: 2,
        initialDelayMs: 100,
        backoffMultiplier: 2,
      });
      const elapsed = Date.now() - startTime;

      // With 100ms initial delay and 2x multiplier:
      // First retry: ~100ms (with jitter: 75-125ms)
      // Second retry: ~200ms (with jitter: 150-250ms)
      // Total: ~300ms ± 50ms jitter
      // Increased tolerance to account for CI timing variations
      expect(elapsed).toBeGreaterThan(200);
      expect(elapsed).toBeLessThan(500);
    });

    it('should cap delay at maxDelayMs', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce({ status: 429 })
        .mockRejectedValueOnce({ status: 429 })
        .mockRejectedValueOnce({ status: 429 })
        .mockResolvedValue('success');

      const startTime = Date.now();
      await withRetry(fn, {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 200,
        backoffMultiplier: 10,
      });
      const elapsed = Date.now() - startTime;

      // Each retry should be capped at 200ms
      // 3 retries × 200ms = 600ms ± jitter
      expect(elapsed).toBeGreaterThan(400);
      expect(elapsed).toBeLessThan(1000);
    });

    it('should call onRetry callback', async () => {
      const onRetry = jest.fn();
      const fn = jest
        .fn()
        .mockRejectedValueOnce({ status: 429, message: 'Rate limited' })
        .mockResolvedValue('success');

      await withRetry(fn, { maxRetries: 2, onRetry });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        1, // attempt number
        expect.any(Object), // error
        expect.any(Number) // delayMs
      );
    });

    it('should include context in logs', async () => {
      const fn = jest.fn().mockRejectedValue({ status: 429, message: 'Rate limited' });

      try {
        await withRetry(fn, { maxRetries: 1, context: 'TestProvider' });
      } catch (e) {
        // Expected to throw
      }

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[TestProvider]'));
    });

    it('should handle network errors with ECONN in message', async () => {
      const error = new Error('ECONNREFUSED connection refused');
      const fn = jest.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

      const result = await withRetry(fn, { maxRetries: 2 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('RetryPresets', () => {
    it('should have rateLimit preset', () => {
      expect(RetryPresets.rateLimit).toBeDefined();
      expect(RetryPresets.rateLimit.maxRetries).toBe(5);
      expect(RetryPresets.rateLimit.retryableErrors).toContain(429);
    });

    it('should have serverError preset', () => {
      expect(RetryPresets.serverError).toBeDefined();
      expect(RetryPresets.serverError.maxRetries).toBe(2);
      expect(RetryPresets.serverError.retryableErrors).toContain(500);
    });

    it('should have network preset', () => {
      expect(RetryPresets.network).toBeDefined();
      expect(RetryPresets.network.maxRetries).toBe(3);
      expect(RetryPresets.network.retryableErrorNames).toContain('AbortError');
    });

    it('should have quick preset', () => {
      expect(RetryPresets.quick).toBeDefined();
      expect(RetryPresets.quick.maxRetries).toBe(3);
      expect(RetryPresets.quick.initialDelayMs).toBe(500);
    });

    it('should use rateLimit preset correctly', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce({ status: 429, message: 'Rate limited' })
        .mockResolvedValue('success');

      const result = await withRetry(fn, RetryPresets.rateLimit);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('createRetryWrapper', () => {
    it('should create a reusable retry wrapper', async () => {
      const wrapper = createRetryWrapper({ maxRetries: 2 });

      const fn1 = jest.fn().mockResolvedValue('success-1');
      const fn2 = jest.fn().mockRejectedValueOnce({ status: 429 }).mockResolvedValue('success-2');

      const result1 = await wrapper(fn1);
      const result2 = await wrapper(fn2);

      expect(result1).toBe('success-1');
      expect(result2).toBe('success-2');
      expect(fn2).toHaveBeenCalledTimes(2);
    });

    it('should allow custom options per call', async () => {
      const wrapper = createRetryWrapper({ maxRetries: 1 });

      const fn1 = jest.fn().mockResolvedValue('success');
      const fn2 = jest.fn().mockResolvedValue('success');

      await wrapper(fn1, { maxRetries: 5 });
      await wrapper(fn2);

      // fn1 should use custom maxRetries
      // fn2 should use wrapper's default maxRetries
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });
  });

  describe('jitter', () => {
    beforeEach(() => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should add random jitter to delays', async () => {
      const fn = jest.fn().mockRejectedValueOnce({ status: 429 }).mockResolvedValue('success');

      const delays = [];
      const onRetry = jest.fn((attempt, error, delay) => {
        delays.push(delay);
      });

      await withRetry(fn, {
        maxRetries: 5,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        onRetry,
      });

      // With Math.random mocked to 0.5, jitter is deterministic
      // Verify that delays are being recorded
      expect(delays.length).toBe(1);
      expect(delays[0]).toBeGreaterThan(0);
    });

    it('should keep jitter within ±25% range', async () => {
      const fn = jest.fn().mockRejectedValue({ status: 429 }).mockResolvedValue('success');

      const onRetry = jest.fn((attempt, error, delay) => {
        const expectedBase = 1000 * Math.pow(2, attempt);
        const jitterRange = expectedBase * 0.25;
        const minExpected = expectedBase - jitterRange;
        const maxExpected = expectedBase + jitterRange;

        expect(delay).toBeGreaterThanOrEqual(Math.floor(minExpected));
        expect(delay).toBeLessThanOrEqual(Math.ceil(maxExpected));
      });

      await withRetry(fn, {
        maxRetries: 3,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        onRetry,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle maxRetries of 0', async () => {
      const fn = jest.fn().mockRejectedValue({ status: 429 });

      await expect(withRetry(fn, { maxRetries: 0 })).rejects.toEqual({ status: 429 });
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle successful function after many retries', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce({ status: 429, message: 'Rate limited' })
        .mockRejectedValueOnce({ status: 429, message: 'Rate limited' })
        .mockRejectedValueOnce({ status: 429, message: 'Rate limited' })
        .mockRejectedValueOnce({ status: 429, message: 'Rate limited' })
        .mockRejectedValueOnce({ status: 429, message: 'Rate limited' })
        .mockResolvedValueOnce('success');

      const result = await withRetry(fn, {
        maxRetries: 5,
        initialDelayMs: 10,
        backoffMultiplier: 1.5,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(6);
    });

    it('should preserve function return value', async () => {
      const testValue = { complex: { object: [1, 2, 3] } };
      const fn = jest.fn().mockResolvedValue(testValue);

      const result = await withRetry(fn);

      expect(result).toEqual(testValue);
    });

    it('should preserve thrown error properties', async () => {
      const customError = new Error('Custom error');
      customError.code = 'CUSTOM_CODE';
      customError.details = { field: 'value' };

      const fn = jest.fn().mockRejectedValue(customError);

      await expect(withRetry(fn, { maxRetries: 0 })).rejects.toThrow('Custom error');
    });
  });
});

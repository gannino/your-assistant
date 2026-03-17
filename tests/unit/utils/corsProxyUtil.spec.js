import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { fetchWithCorsProxy, needsCorsProxy } from '@/utils/corsProxyUtil';

describe('corsProxyUtil', () => {
  describe('fetchWithCorsProxy', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.restoreAllMocks();
      jest.useRealTimers();
    });

    it('should fetch successfully through first proxy', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const result = await fetchWithCorsProxy('https://api.example.com/data');

      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.allorigins.win/raw?url='),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('should encode URL properly', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      await fetchWithCorsProxy('https://api.example.com/test?param=value');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.allorigins.win/raw?url=https%3A%2F%2Fapi.example.com%2Ftest%3Fparam%3Dvalue',
        expect.any(Object)
      );
    });

    it('should try next proxy on failure', async () => {
      global.fetch = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
        });

      const result = await fetchWithCorsProxy('https://api.example.com/data');

      expect(result.ok).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('allorigins.win'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('corsproxy.io/?'),
        expect.any(Object)
      );
    });

    it('should try all proxies on multiple failures', async () => {
      global.fetch = jest.fn()
        .mockRejectedValueOnce(new Error('Proxy 1 failed'))
        .mockRejectedValueOnce(new Error('Proxy 2 failed'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
        });

      const result = await fetchWithCorsProxy('https://api.example.com/data');

      expect(result.ok).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should throw error when all proxies fail', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('All failed'));

      await expect(fetchWithCorsProxy('https://api.example.com/data')).rejects.toThrow(
        'Failed to fetch through CORS proxies after 3 attempts'
      );
    });

    it('should include last error in final error message', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Specific error'));

      await expect(fetchWithCorsProxy('https://api.example.com/data')).rejects.toThrow(
        'Specific error'
      );
    });

    it('should throw on non-ok response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(fetchWithCorsProxy('https://api.example.com/data')).rejects.toThrow(
        'HTTP 404: Not Found'
      );
    });

    it('should continue to next proxy on non-ok response', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
        });

      const result = await fetchWithCorsProxy('https://api.example.com/data');

      expect(result.ok).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should set 30 second timeout', async () => {
      jest.useRealTimers();
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      await fetchWithCorsProxy('https://api.example.com/data');

      const callArgs = fetch.mock.calls[0];
      expect(callArgs[1].signal).toBeDefined();
    });

    it('should handle timeout and try next proxy', async () => {
      let firstCall = true;
      global.fetch = jest.fn().mockImplementation(() => {
        if (firstCall) {
          firstCall = false;
          // Simulate timeout with AbortError
          const error = new Error('Aborted');
          error.name = 'AbortError';
          return Promise.reject(error);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
        });
      });

      jest.useRealTimers();

      const result = await fetchWithCorsProxy('https://api.example.com/data');

      expect(result.ok).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should pass custom headers to proxy', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const headers = { 'X-Custom-Header': 'value' };
      await fetchWithCorsProxy('https://api.example.com/data', { headers });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers,
        })
      );
    });

    it('should pass custom method to proxy', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      await fetchWithCorsProxy('https://api.example.com/data', { method: 'POST' });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should pass custom body to proxy', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const body = JSON.stringify({ test: 'data' });
      await fetchWithCorsProxy('https://api.example.com/data', { body });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body,
        })
      );
    });

    it('should use default headers when not provided', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      await fetchWithCorsProxy('https://api.example.com/data');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {},
        })
      );
    });

    it('should log proxy attempts', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      await fetchWithCorsProxy('https://api.example.com/data');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Trying proxy:')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Target URL:')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Response:')
      );
    });

    it('should log success message', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      await fetchWithCorsProxy('https://api.example.com/data');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✅ Success with proxy:')
      );
    });

    it('should log failure message', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(fetchWithCorsProxy('https://api.example.com/data')).rejects.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Proxy')
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Network error')
      );
    });

    it('should log final error when all proxies fail', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Final error'));

      await expect(fetchWithCorsProxy('https://api.example.com/data')).rejects.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('All proxies failed')
      );
    });

    it('should handle AbortError as timeout', async () => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      global.fetch = jest.fn().mockRejectedValue(error);

      await expect(fetchWithCorsProxy('https://api.example.com/data')).rejects.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Request timeout')
      );
    });
  });

  describe('needsCorsProxy', () => {
    let originalLocation;

    beforeEach(() => {
      originalLocation = window.location;
      delete window.location;
      window.location = new URL('http://localhost:8080');
    });

    afterEach(() => {
      window.location = originalLocation;
    });

    it('should return false for same origin', () => {
      expect(needsCorsProxy('http://localhost:8080/api')).toBe(false);
      expect(needsCorsProxy('http://localhost:8080/')).toBe(false);
      // Relative URLs fail URL parsing and return true (safe default)
      expect(needsCorsProxy('/api')).toBe(true);
    });

    it('should return true for Anthropic API', () => {
      expect(needsCorsProxy('https://api.anthropic.com/v1/messages')).toBe(true);
      expect(needsCorsProxy('https://api.anthropic.com/v1/')).toBe(true);
    });

    it('should return true for Google Generative Language API', () => {
      expect(needsCorsProxy('https://generativelanguage.googleapis.com/v1/models')).toBe(true);
      expect(needsCorsProxy('https://generativelanguage.googleapis.com/')).toBe(true);
    });

    it('should return true for OpenAI API', () => {
      expect(needsCorsProxy('https://api.openai.com/v1/chat/completions')).toBe(true);
      expect(needsCorsProxy('https://api.openai.com/v1/')).toBe(true);
    });

    it('should return false for non-restricted APIs', () => {
      expect(needsCorsProxy('https://api.example.com/data')).toBe(false);
      expect(needsCorsProxy('https://api.github.com/repos')).toBe(false);
      expect(needsCorsProxy('https://httpbin.org/get')).toBe(false);
    });

    it('should return true for same origin but different port', () => {
      expect(needsCorsProxy('http://localhost:3000/api')).toBe(false);
    });

    it('should return true for invalid URLs', () => {
      expect(needsCorsProxy('not-a-url')).toBe(true);
      expect(needsCorsProxy('')).toBe(true);
      expect(needsCorsProxy(undefined)).toBe(true);
    });

    it('should handle URLs with subdomains', () => {
      expect(needsCorsProxy('https://v1.api.anthropic.com/messages')).toBe(true);
    });

    it('should be case insensitive for domain matching (URL normalizes to lowercase)', () => {
      // URL constructor automatically lowercases hostnames
      expect(needsCorsProxy('https://api.Anthropic.com/v1')).toBe(true);
      expect(needsCorsProxy('https://API.OPENAI.COM/v1')).toBe(true);
      expect(needsCorsProxy('https://generativelanguage.GOOGLEAPIS.COM/v1')).toBe(true);
    });

    it('should handle URLs with paths and query strings', () => {
      expect(needsCorsProxy('https://api.openai.com/v1/chat?param=value')).toBe(true);
      expect(needsCorsProxy('https://api.anthropic.com/v1/messages#section')).toBe(true);
    });

    it('should handle different protocols', () => {
      expect(needsCorsProxy('http://api.anthropic.com/v1')).toBe(true);
      expect(needsCorsProxy('https://api.openai.com/v1')).toBe(true);
    });
  });
});

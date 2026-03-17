import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { diagnoseWebsiteFetching, quickTest } from '@/utils/diagnostic_util';

// Mock navigator and fetch
const mockNavigator = {
  userAgent: 'Mozilla/5.0 Test Browser',
  platform: 'TestOS',
  onLine: true,
};

const mockAbortController = jest.fn();
mockAbortController.mockImplementation(() => ({
  signal: {},
  abort: jest.fn(),
}));

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});

global.AbortController = mockAbortController;

describe('diagnostic_util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('diagnoseWebsiteFetching', () => {
    it('should validate URL before testing', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue('text/html'),
        },
        text: async () => '<html>Test content</html>',
      });

      await diagnoseWebsiteFetching('invalid-url');

      expect(console.error).toHaveBeenCalledWith(
        '[Diagnostic] URL validation failed:',
        'Invalid URL format'
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should log browser capabilities', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue('text/html'),
        },
        text: async () => 'content',
      });

      await diagnoseWebsiteFetching('https://example.com');

      // Check initial diagnostics header
      expect(console.log).toHaveBeenCalledWith('=== Website Fetching Diagnostics ===');
      expect(console.log).toHaveBeenCalledWith('URL:', 'https://example.com');
      expect(console.log).toHaveBeenCalledWith('User Agent:', 'Mozilla/5.0 Test Browser');
      expect(console.log).toHaveBeenCalledWith('Platform:', 'TestOS');
      expect(console.log).toHaveBeenCalledWith('Online:', true);

      // Check browser capabilities section
      expect(console.log).toHaveBeenCalledWith('\n=== Browser Capabilities ===');
      expect(console.log).toHaveBeenCalledWith('Fetch API:', true);
      expect(console.log).toHaveBeenCalledWith('AbortController:', true);
      expect(console.log).toHaveBeenCalledWith('DOMParser:', true);
      expect(console.log).toHaveBeenCalledWith('Promise:', true);
    });

    it('should test CORS proxies successfully', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue('text/html; charset=utf-8'),
        },
        text: async () => 'Example website content',
      });

      await diagnoseWebsiteFetching('https://example.com');

      // Should test all 3 proxies
      expect(fetch).toHaveBeenCalledTimes(3);
      // Check that each proxy URL is used
      const firstCallArgs = fetch.mock.calls[0][0];
      const secondCallArgs = fetch.mock.calls[1][0];
      const thirdCallArgs = fetch.mock.calls[2][0];

      expect(firstCallArgs).toContain('https://api.allorigins.win/raw?url=');
      expect(secondCallArgs).toContain('https://corsproxy.io/?');
      expect(thirdCallArgs).toContain('https://api.codetabs.com/v1/proxy?quest=');
    });

    it('should handle fetch errors gracefully', async () => {
      const abortError = new Error('Request timeout');
      abortError.name = 'AbortError';

      global.fetch.mockRejectedValue(abortError);

      await diagnoseWebsiteFetching('https://example.com');

      expect(console.error).toHaveBeenCalledWith('✗ Failed:', 'AbortError', '-', 'Request timeout');
      expect(console.error).toHaveBeenCalledWith('  Reason: Request timeout (>10s)');
    });

    it('should handle network errors', async () => {
      const typeError = new Error('Failed to fetch');
      typeError.name = 'TypeError';

      global.fetch.mockRejectedValue(typeError);

      await diagnoseWebsiteFetching('https://example.com');

      expect(console.error).toHaveBeenCalledWith('✗ Failed:', 'TypeError', '-', 'Failed to fetch');
      expect(console.error).toHaveBeenCalledWith('  Reason: Network error or CORS issue');
    });

    it('should log response details', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        text: async () => '{"data": "test"}',
      });

      await diagnoseWebsiteFetching('https://example.com');

      // The function logs these specific values - we need to match the exact format
      // Note: elapsed time will vary, so we just check it was called
      expect(console.log).toHaveBeenCalledWith('✓ Status:', 200, 'OK');
      expect(console.log).toHaveBeenCalledWith('✓ Content-Type:', 'application/json');
      expect(console.log).toHaveBeenCalledWith('✓ Content length:', 16, 'characters');

      // Check that Time was logged (with actual milliseconds value)
      const timeCalls = console.log.mock.calls.filter(call =>
        call[0] === '✓ Time:' && typeof call[1] === 'string' && call[1].endsWith('ms')
      );
      expect(timeCalls.length).toBeGreaterThan(0);

      // Check that first 200 chars were logged
      expect(console.log).toHaveBeenCalledWith('✓ First 200 chars:', '{"data": "test"}');
    });

    it('should handle all proxies failing', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await diagnoseWebsiteFetching('https://example.com');

      // Should still test all 3 proxies even if they fail
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('quickTest', () => {
    it('should run diagnostics with example.com', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue('text/html'),
        },
        text: async () => 'Example domain',
      });

      await quickTest();

      expect(console.log).toHaveBeenCalledWith('Running quick test with example.com...');

      // The fetch is called with CORS proxy URLs that include the encoded example.com
      // Check that at least one fetch call contains the encoded URL
      const fetchCalls = global.fetch.mock.calls;
      const hasExampleComCall = fetchCalls.some(call =>
        call[0].includes('https%3A%2F%2Fexample.com')
      );
      expect(hasExampleComCall).toBe(true);
    });
  });
});

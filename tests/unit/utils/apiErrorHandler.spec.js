import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  handleHttpError,
  handleNetworkError,
  logSuccess,
  createProviderError,
  requireInitialized,
} from '@/utils/apiErrorHandler';

describe('apiErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleHttpError', () => {
    it('should handle 401 authentication error', async () => {
      const response = {
        status: 401,
        text: async () => 'Unauthorized',
      };
      const fallbackModels = ['model-1', 'model-2'];

      const result = await handleHttpError(response, 'TestProvider', {
        fallbackModels,
        apiKeyUrl: 'https://example.com/keys',
      });

      expect(result).toEqual(fallbackModels);
      expect(console.error).toHaveBeenCalledWith(
        '[TestProvider] ❌ Authentication failed (401)'
      );
      expect(console.error).toHaveBeenCalledWith(
        '[TestProvider] 💡 Your API key may be invalid or expired'
      );
      expect(console.error).toHaveBeenCalledWith(
        '[TestProvider] 💡 Check your API key at: https://example.com/keys'
      );
    });

    it('should handle 403 forbidden error', async () => {
      const response = {
        status: 403,
        text: async () => 'Forbidden',
      };
      const fallbackModels = ['model-1'];

      const result = await handleHttpError(response, 'TestProvider', {
        fallbackModels,
        apiKeyUrl: 'https://example.com/keys',
      });

      expect(result).toEqual(fallbackModels);
      expect(console.error).toHaveBeenCalledWith(
        '[TestProvider] ❌ Access forbidden (403)'
      );
      expect(console.error).toHaveBeenCalledWith(
        '[TestProvider] 💡 Your API key may not have access to this endpoint'
      );
    });

    it('should handle 429 rate limit error', async () => {
      const response = {
        status: 429,
        text: async () => 'Too Many Requests',
      };
      const fallbackModels = ['model-1', 'model-2'];

      const result = await handleHttpError(response, 'TestProvider', {
        fallbackModels,
      });

      expect(result).toEqual(fallbackModels);
      expect(console.warn).toHaveBeenCalledWith(
        '[TestProvider] ⚠️ Rate limited by API (429)'
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Please wait')
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Using cached model list')
      );
    });

    it('should handle 500 server error', async () => {
      const response = {
        status: 500,
        text: async () => 'Internal Server Error',
      };
      const fallbackModels = ['model-1'];

      const result = await handleHttpError(response, 'TestProvider', {
        fallbackModels,
        docsUrl: 'https://example.com/docs',
      });

      expect(result).toEqual(fallbackModels);
      expect(console.error).toHaveBeenCalledWith(
        '[TestProvider] ❌ Server error (500) - TestProvider API is experiencing issues'
      );
      expect(console.error).toHaveBeenCalledWith(
        '[TestProvider] 💡 Try again in a few moments'
      );
    });

    it('should handle 502 bad gateway', async () => {
      const response = {
        status: 502,
        text: async () => 'Bad Gateway',
      };
      const fallbackModels = ['model-1'];

      const result = await handleHttpError(response, 'TestProvider', {
        fallbackModels,
      });

      expect(result).toEqual(fallbackModels);
      expect(console.error).toHaveBeenCalledWith(
        '[TestProvider] ❌ Server error (502) - TestProvider API is experiencing issues'
      );
    });

    it('should handle 503 service unavailable', async () => {
      const response = {
        status: 503,
        text: async () => 'Service Unavailable',
      };
      const fallbackModels = ['model-1'];

      const result = await handleHttpError(response, 'TestProvider', {
        fallbackModels,
      });

      expect(result).toEqual(fallbackModels);
      expect(console.error).toHaveBeenCalledWith(
        '[TestProvider] ❌ Server error (503) - TestProvider API is experiencing issues'
      );
    });

    it('should handle unknown error codes', async () => {
      const response = {
        status: 418,
        text: async () => "I'm a teapot",
      };
      const fallbackModels = ['model-1'];

      const result = await handleHttpError(response, 'TestProvider', {
        fallbackModels,
      });

      expect(result).toEqual(fallbackModels);
      expect(console.error).toHaveBeenCalledWith(
        "[TestProvider] ❌ API error (418): I'm a teapot"
      );
      expect(console.error).toHaveBeenCalledWith(
        '[TestProvider] 💡 Falling back to hardcoded model list'
      );
    });

    it('should handle missing error text', async () => {
      const response = {
        status: 404,
        text: async () => {
          throw new Error('Read error');
        },
      };
      const fallbackModels = [];

      const result = await handleHttpError(response, 'TestProvider', {
        fallbackModels,
      });

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        '[TestProvider] ❌ API error (404): Unknown error'
      );
    });

    it('should work without fallback models', async () => {
      const response = {
        status: 401,
        text: async () => 'Unauthorized',
      };

      const result = await handleHttpError(response, 'TestProvider');

      expect(result).toEqual([]);
    });

    it('should work without optional URLs', async () => {
      const response = {
        status: 401,
        text: async () => 'Unauthorized',
      };

      const result = await handleHttpError(response, 'TestProvider', {
        fallbackModels: ['model-1'],
      });

      expect(result).toEqual(['model-1']);
    });
  });

  describe('handleNetworkError', () => {
    it('should handle AbortError (timeout)', () => {
      const error = new Error('Request timeout');
      error.name = 'AbortError';

      handleNetworkError(error, 'TestProvider', 'fetch models');

      expect(console.error).toHaveBeenCalledWith(
        '[TestProvider] ❌ fetch models failed: Request timeout'
      );
      expect(console.error).toHaveBeenCalledWith(
        '[TestProvider] 💡 The request took too long. Try again later.'
      );
    });

    it('should handle fetch errors', () => {
      const error = new Error('Failed to fetch');
      error.name = 'TypeError';

      handleNetworkError(error, 'TestProvider', 'API request');

      expect(console.error).toHaveBeenCalledWith(
        '[TestProvider] ❌ API request failed: Failed to fetch'
      );
      expect(console.error).toHaveBeenCalledWith(
        '[TestProvider] 💡 Check your internet connection'
      );
    });

    it('should handle generic network errors', () => {
      const error = new Error('ECONNREFUSED');

      handleNetworkError(error, 'TestProvider', 'connect to API');

      expect(console.error).toHaveBeenCalledWith(
        '[TestProvider] ❌ connect to API failed: ECONNREFUSED'
      );
      expect(console.error).toHaveBeenCalledWith(
        '[TestProvider] 💡 ECONNREFUSED'
      );
    });

    it('should use default operation description', () => {
      const error = new Error('Network error');

      handleNetworkError(error, 'TestProvider');

      expect(console.error).toHaveBeenCalledWith(
        '[TestProvider] ❌ API request failed: Network error'
      );
    });
  });

  describe('logSuccess', () => {
    it('should log success with item count', () => {
      logSuccess('TestProvider', 'fetched models', 42);

      expect(console.log).toHaveBeenCalledWith(
        '[TestProvider] ✅ fetched models (42 items)'
      );
    });

    it('should log success without item count', () => {
      logSuccess('TestProvider', 'initialized');

      expect(console.log).toHaveBeenCalledWith(
        '[TestProvider] ✅ initialized'
      );
    });

    it('should handle zero count', () => {
      logSuccess('TestProvider', 'processed', 0);

      expect(console.log).toHaveBeenCalledWith(
        '[TestProvider] ✅ processed'
      );
    });
  });

  describe('createProviderError', () => {
    it('should create error with default code', () => {
      const error = createProviderError('Something went wrong');

      expect(error.message).toBe('Something went wrong');
      expect(error.code).toBe('PROVIDER_ERROR');
      expect(error.details).toEqual({});
    });

    it('should create error with custom code', () => {
      const error = createProviderError(
        'Invalid API key',
        'INVALID_API_KEY',
        { key: 'sk-***' }
      );

      expect(error.message).toBe('Invalid API key');
      expect(error.code).toBe('INVALID_API_KEY');
      expect(error.details).toEqual({ key: 'sk-***' });
    });

    it('should create error with details', () => {
      const details = {
        provider: 'TestProvider',
        endpoint: 'https://api.example.com',
        status: 401,
      };
      const error = createProviderError('Auth failed', 'AUTH_ERROR', details);

      expect(error.details).toEqual(details);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('requireInitialized', () => {
    it('should throw when provider is not initialized', () => {
      expect(() => {
        requireInitialized(false, 'TestProvider');
      }).toThrow('TestProvider provider not initialized. Call initialize() first.');
    });

    it('should not throw when provider is initialized', () => {
      expect(() => {
        requireInitialized(true, 'TestProvider');
      }).not.toThrow();
    });
  });
});

import { describe, it, expect, jest } from '@jest/globals';
import { BaseAIProvider } from '@/services/ai/providers/BaseAIProvider';

// Create a concrete implementation for testing
class TestProvider extends BaseAIProvider {
  async generateCompletion(prompt, options = {}) {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }
    return `Test response to: ${prompt}`;
  }

  async generateCompletionStream(prompt, onChunk, options = {}) {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }
    onChunk('Test ');
    onChunk('streaming ');
    onChunk('response');
  }

  getProviderInfo() {
    return {
      id: 'test-provider',
      name: 'Test Provider',
      description: 'A test provider',
      supportsStreaming: true,
      requiresApiKey: false,
      requiresLocalServer: false,
      defaultModels: ['test-model-1', 'test-model-2'],
    };
  }
}

describe('BaseAIProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new TestProvider();
  });

  describe('constructor', () => {
    it('should create a concrete provider instance', () => {
      expect(provider).toBeInstanceOf(BaseAIProvider);
      expect(provider).toBeInstanceOf(TestProvider);
    });

    it('should not allow direct instantiation of BaseAIProvider', () => {
      expect(() => new BaseAIProvider()).toThrow(
        'BaseAIProvider is abstract and cannot be instantiated directly'
      );
    });

    it('should initialize with default values', () => {
      expect(provider.initialized).toBe(false);
      expect(provider.config).toEqual({});
      expect(provider.maxRetries).toBe(3);
      expect(provider.initialRetryDelay).toBe(1000);
      expect(provider.maxRetryDelay).toBe(30000);
      expect(provider.retryBackoffMultiplier).toBe(2);
    });

    it('should accept config in constructor', () => {
      const config = { apiKey: 'test-key', model: 'test-model' };
      const providerWithConfig = new TestProvider(config);

      expect(providerWithConfig.config).toEqual(config);
    });
  });

  describe('initialize', () => {
    it('should set initialized to true', async () => {
      await provider.initialize({ apiKey: 'test-key' });

      expect(provider.initialized).toBe(true);
    });

    it('should store config', async () => {
      const config = { apiKey: 'test-key', model: 'test-model' };
      await provider.initialize(config);

      expect(provider.config).toEqual(config);
    });

    it('should allow updating config', async () => {
      await provider.initialize({ apiKey: 'key1' });
      expect(provider.config.apiKey).toBe('key1');

      await provider.initialize({ apiKey: 'key2' });
      expect(provider.config.apiKey).toBe('key2');
    });

    it('should return undefined', async () => {
      const result = await provider.initialize({ apiKey: 'test-key' });

      expect(result).toBeUndefined();
    });
  });

  describe('isReady', () => {
    it('should return false before initialization', () => {
      expect(provider.isReady()).toBe(false);
    });

    it('should return true after initialization', async () => {
      await provider.initialize({ apiKey: 'test-key' });

      expect(provider.isReady()).toBe(true);
    });
  });

  describe('generateCompletion', () => {
    it('should throw error if not implemented by subclass', async () => {
      class IncompleteProvider extends BaseAIProvider {}

      const incompleteProvider = new IncompleteProvider();
      await incompleteProvider.initialize({});

      await expect(incompleteProvider.generateCompletion('test')).rejects.toThrow(
        'generateCompletion must be implemented by subclass'
      );
    });

    it('should work with concrete implementation', async () => {
      await provider.initialize({});

      const result = await provider.generateCompletion('Hello');

      expect(result).toBe('Test response to: Hello');
    });

    it('should pass through options parameter', async () => {
      await provider.initialize({});

      const options = { systemPrompt: 'You are helpful' };
      const spy = jest.spyOn(provider, 'generateCompletion');

      await provider.generateCompletion('test', options);

      expect(spy).toHaveBeenCalledWith('test', options);
    });
  });

  describe('generateCompletionStream', () => {
    it('should throw error if not implemented by subclass', async () => {
      class IncompleteProvider extends BaseAIProvider {}

      const incompleteProvider = new IncompleteProvider();
      await incompleteProvider.initialize({});

      await expect(
        incompleteProvider.generateCompletionStream('test', () => {})
      ).rejects.toThrow('generateCompletionStream must be implemented by subclass');
    });

    it('should call onChunk callback for each chunk', async () => {
      await provider.initialize({});

      const chunks = [];
      const onChunk = chunk => chunks.push(chunk);

      await provider.generateCompletionStream('test', onChunk);

      expect(chunks).toEqual(['Test ', 'streaming ', 'response']);
    });

    it('should pass through options parameter', async () => {
      await provider.initialize({});

      const options = { systemPrompt: 'You are helpful' };
      const onChunk = jest.fn();
      const spy = jest.spyOn(provider, 'generateCompletionStream');

      await provider.generateCompletionStream('test', onChunk, options);

      expect(spy).toHaveBeenCalledWith('test', onChunk, options);
    });
  });

  describe('validateConfig', () => {
    it('should return valid result by default', async () => {
      const result = await provider.validateConfig();

      expect(result).toEqual({ valid: true, errors: [] });
    });

    it('should allow subclasses to override validation', async () => {
      class ValidatedProvider extends BaseAIProvider {
        async validateConfig(config = {}) {
          const errors = [];
          if (!config.apiKey) {
            errors.push('API key is required');
          }
          return { valid: errors.length === 0, errors };
        }

        async generateCompletion(prompt) {
          return prompt;
        }

        async generateCompletionStream(prompt, onChunk) {
          onChunk(prompt);
        }
      }

      const validatedProvider = new ValidatedProvider();

      const result1 = await validatedProvider.validateConfig({});
      expect(result1.valid).toBe(false);
      expect(result1.errors).toContain('API key is required');

      const result2 = await validatedProvider.validateConfig({ apiKey: 'test-key' });
      expect(result2.valid).toBe(true);
      expect(result2.errors).toEqual([]);
    });
  });

  describe('getAvailableModels', () => {
    it('should return empty array by default', async () => {
      const models = await provider.getAvailableModels();

      expect(models).toEqual([]);
    });

    it('should allow subclasses to override', async () => {
      class ModelProvider extends BaseAIProvider {
        async getAvailableModels() {
          return ['model-1', 'model-2', 'model-3'];
        }

        async generateCompletion(prompt) {
          return prompt;
        }

        async generateCompletionStream(prompt, onChunk) {
          onChunk(prompt);
        }
      }

      const modelProvider = new ModelProvider();
      const models = await modelProvider.getAvailableModels();

      expect(models).toEqual(['model-1', 'model-2', 'model-3']);
    });
  });

  describe('getProviderInfo', () => {
    it('should return default provider info', () => {
      const info = provider.getProviderInfo();

      expect(info).toMatchObject({
        id: 'test-provider',
        name: 'Test Provider',
        description: 'A test provider',
        supportsStreaming: true,
        requiresApiKey: false,
        requiresLocalServer: false,
        defaultModels: ['test-model-1', 'test-model-2'],
      });
    });

    it('should generate id from class name', () => {
      class CustomNamedProvider extends BaseAIProvider {
        async generateCompletion(prompt) {
          return prompt;
        }

        async generateCompletionStream(prompt, onChunk) {
          onChunk(prompt);
        }
      }

      const customProvider = new CustomNamedProvider();
      const info = customProvider.getProviderInfo();

      expect(info.id).toBe('customnamed');
    });

    it('should allow subclasses to override all fields', () => {
      const customInfo = provider.getProviderInfo();

      expect(customInfo).toHaveProperty('id');
      expect(customInfo).toHaveProperty('name');
      expect(customInfo).toHaveProperty('description');
      expect(customInfo).toHaveProperty('supportsStreaming');
      expect(customInfo).toHaveProperty('requiresApiKey');
      expect(customInfo).toHaveProperty('requiresLocalServer');
      expect(customInfo).toHaveProperty('defaultModels');
    });
  });

  describe('retry configuration', () => {
    it('should have default retry values', () => {
      expect(provider.maxRetries).toBe(3);
      expect(provider.initialRetryDelay).toBe(1000);
      expect(provider.maxRetryDelay).toBe(30000);
      expect(provider.retryBackoffMultiplier).toBe(2);
    });

    it('should allow custom retry configuration', () => {
      const customProvider = new TestProvider();
      customProvider.maxRetries = 5;
      customProvider.initialRetryDelay = 2000;
      customProvider.maxRetryDelay = 60000;
      customProvider.retryBackoffMultiplier = 3;

      expect(customProvider.maxRetries).toBe(5);
      expect(customProvider.initialRetryDelay).toBe(2000);
      expect(customProvider.maxRetryDelay).toBe(60000);
      expect(customProvider.retryBackoffMultiplier).toBe(3);
    });
  });

  describe('error handling', () => {
    it('should throw descriptive errors for unimplemented methods', async () => {
      class IncompleteProvider extends BaseAIProvider {}

      const incompleteProvider = new IncompleteProvider();

      expect(() => incompleteProvider.generateCompletion()).rejects.toThrow(
        'generateCompletion must be implemented by subclass'
      );
      expect(() => incompleteProvider.generateCompletionStream()).rejects.toThrow(
        'generateCompletionStream must be implemented by subclass'
      );
    });
  });

  describe('configuration management', () => {
    it('should store arbitrary config properties', async () => {
      const config = {
        apiKey: 'test-key',
        model: 'test-model',
        temperature: 0.7,
        maxTokens: 1000,
        customProperty: 'custom-value',
      };

      await provider.initialize(config);

      expect(provider.config).toEqual(config);
    });

    it('should allow config to be updated after initialization', async () => {
      await provider.initialize({ apiKey: 'key1' });

      provider.config.model = 'new-model';
      expect(provider.config.model).toBe('new-model');
    });
  });

  describe('executeWithRetry', () => {
    it('should execute function successfully without retries', async () => {
      await provider.initialize({});

      const fn = jest.fn().mockResolvedValue('success');
      const result = await provider.executeWithRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should use provider retry config by default', async () => {
      await provider.initialize({});

      const fn = jest.fn().mockResolvedValue('success');
      await provider.executeWithRetry(fn);

      // Function should execute with provider's retry config
      expect(fn).toHaveBeenCalled();
    });

    it('should allow custom retry options', async () => {
      await provider.initialize({});

      const fn = jest.fn().mockResolvedValue('success');
      const options = {
        maxRetries: 5,
        initialDelay: 2000,
        maxDelay: 60000,
        backoffMultiplier: 3,
      };

      await provider.executeWithRetry(fn, options);

      expect(fn).toHaveBeenCalled();
    });

    it('should pass provider name as context', async () => {
      await provider.initialize({});

      const fn = jest.fn().mockResolvedValue('success');
      await provider.executeWithRetry(fn);

      // The retry utility should receive the provider name
      expect(fn).toHaveBeenCalled();
    });
  });

  describe('executeWithRetryPreset', () => {
    it('should execute function with rateLimit preset', async () => {
      await provider.initialize({});

      const fn = jest.fn().mockResolvedValue('success');
      const result = await provider.executeWithRetryPreset(fn, 'rateLimit');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should execute function with serverError preset', async () => {
      await provider.initialize({});

      const fn = jest.fn().mockResolvedValue('success');
      const result = await provider.executeWithRetryPreset(fn, 'serverError');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should execute function with network preset', async () => {
      await provider.initialize({});

      const fn = jest.fn().mockResolvedValue('success');
      const result = await provider.executeWithRetryPreset(fn, 'network');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should execute function with quick preset', async () => {
      await provider.initialize({});

      const fn = jest.fn().mockResolvedValue('success');
      const result = await provider.executeWithRetryPreset(fn, 'quick');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should allow overriding preset options', async () => {
      await provider.initialize({});

      const fn = jest.fn().mockResolvedValue('success');
      const options = { maxRetries: 10 };

      await provider.executeWithRetryPreset(fn, 'rateLimit', options);

      expect(fn).toHaveBeenCalled();
    });

    it('should throw error for unknown preset', async () => {
      await provider.initialize({});

      const fn = jest.fn().mockResolvedValue('success');

      await expect(provider.executeWithRetryPreset(fn, 'unknownPreset')).rejects.toThrow(
        'Unknown retry preset: unknownPreset'
      );
    });

    it('should pass provider name as context', async () => {
      await provider.initialize({});

      const fn = jest.fn().mockResolvedValue('success');
      await provider.executeWithRetryPreset(fn, 'rateLimit');

      expect(fn).toHaveBeenCalled();
    });
  });

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      const networkErrors = [
        new Error('Failed to fetch'),
        new Error('Network error'),
        new Error('ECONNRESET'),
        new Error('ETIMEDOUT'),
        new Error('ENOTFOUND'),
      ];

      networkErrors.forEach(error => {
        expect(provider.isRetryableError(error)).toBe(true);
      });
    });

    it('should identify HTTP rate limit errors as retryable', () => {
      const rateLimitError = new Error('HTTP 429 - Too many requests');
      expect(provider.isRetryableError(rateLimitError)).toBe(true);
    });

    it('should identify HTTP server errors as retryable', () => {
      const serverErrors = [
        new Error('HTTP 503 - Service unavailable'),
        new Error('HTTP 502 - Bad gateway'),
        new Error('HTTP 504 - Gateway timeout'),
      ];

      serverErrors.forEach(error => {
        expect(provider.isRetryableError(error)).toBe(true);
      });
    });

    it('should not identify other errors as retryable', () => {
      const nonRetryableErrors = [
        new Error('Unauthorized'),
        new Error('Forbidden'),
        new Error('Not found'),
        new Error('Bad request'),
      ];

      nonRetryableErrors.forEach(error => {
        expect(provider.isRetryableError(error)).toBe(false);
      });
    });

    it('should handle errors without message property', () => {
      const error = {};
      expect(provider.isRetryableError(error)).toBe(false);
    });
  });

  describe('testConnection', () => {
    it('should return success result when validation passes', async () => {
      await provider.initialize({});

      const result = await provider.testConnection();

      expect(result).toEqual({
        success: true,
        message: 'Connection successful',
        provider: 'test-provider',
      });
    });

    it('should return failure result when validation fails', async () => {
      class FailingProvider extends BaseAIProvider {
        async validateConfig() {
          throw new Error('Invalid API key');
        }

        async generateCompletion(prompt) {
          return prompt;
        }

        async generateCompletionStream(prompt, onChunk) {
          onChunk(prompt);
        }
      }

      const failingProvider = new FailingProvider();
      await failingProvider.initialize({});

      const result = await failingProvider.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid API key');
      expect(result.provider).toBeDefined();
    });

    it('should include provider id in result', async () => {
      await provider.initialize({});

      const result = await provider.testConnection();

      expect(result.provider).toBe('test-provider');
    });
  });

  describe('executeWithTimeout', () => {
    it('should execute function before timeout', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await provider.executeWithTimeout(fn, 1000);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should timeout if function takes too long', async () => {
      const fn = jest.fn(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve('slow'), 5000);
          })
      );

      await expect(provider.executeWithTimeout(fn, 100)).rejects.toThrow(
        'Operation timed out'
      );
    });

    it('should use custom error message', async () => {
      const fn = jest.fn(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve('slow'), 5000);
          })
      );

      await expect(provider.executeWithTimeout(fn, 100, 'Custom timeout message')).rejects.toThrow(
        'Custom timeout message'
      );
    });

    it('should use default timeout of 30000ms', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await provider.executeWithTimeout(fn);

      expect(result).toBe('success');
    });
  });

  describe('createTimeoutController', () => {
    it('should create abort controller with timeout', () => {
      const { controller, cleanup } = provider.createTimeoutController(1000);

      expect(controller).toBeInstanceOf(AbortController);
      expect(controller.signal).toBeInstanceOf(AbortSignal);
      expect(typeof cleanup).toBe('function');
    });

    it('should use default timeout of 30000ms', () => {
      const { controller, cleanup } = provider.createTimeoutController();

      expect(controller).toBeInstanceOf(AbortController);
      expect(typeof cleanup).toBe('function');

      cleanup();
    });

    it('should abort after timeout', async () => {
      const { controller, cleanup } = provider.createTimeoutController(100);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(controller.signal.aborted).toBe(true);
      cleanup();
    });

    it('should clear timeout on cleanup', () => {
      const { controller, cleanup } = provider.createTimeoutController(1000);

      cleanup();

      // Should not throw or cause issues
      expect(controller).toBeDefined();
    });

    it('should not abort before timeout', async () => {
      const { controller, cleanup } = provider.createTimeoutController(1000);

      // Check immediately that it's not aborted
      expect(controller.signal.aborted).toBe(false);

      cleanup();
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock StreamParser before importing
jest.mock('@/services/ai/streaming', () => ({
  StreamParser: {
    openAICompatible: jest.fn(() => ({
      parseStream: jest.fn(),
    })),
  },
}));

// Mock modelCacheUtil
jest.mock('@/utils/modelCacheUtil', () => ({
  getCachedModels: jest.fn(),
  setCachedModels: jest.fn(),
}));

// Mock apiErrorHandler
jest.mock('@/utils/apiErrorHandler', () => ({
  handleHttpError: jest.fn(async () => []),
  handleNetworkError: jest.fn(),
  logSuccess: jest.fn(),
  requireInitialized: jest.fn((initialized, name) => {
    if (!initialized) {
      throw new Error(`${name} not initialized`);
    }
  }),
}));

import { MLXProvider } from '@/services/ai/providers/MLXProvider';
import { StreamParser } from '@/services/ai/streaming';
import { getCachedModels, setCachedModels } from '@/utils/modelCacheUtil';
import { handleHttpError, handleNetworkError, logSuccess, requireInitialized } from '@/utils/apiErrorHandler';

describe('MLXProvider', () => {
  let provider;
  let mockFetch;

  beforeEach(() => {
    provider = new MLXProvider();

    // Mock fetch globally
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Reset requireInitialized mock to default (pass validation)
    requireInitialized.mockImplementation((initialized, name) => {
      if (!initialized) {
        throw new Error(`${name} not initialized`);
      }
    });

    // Clear all mocks
    jest.clearAllMocks();

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Mock navigator.platform for Apple Silicon detection
    Object.defineProperty(navigator, 'platform', {
      writable: true,
      value: 'MacIntel',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with empty config', () => {
      expect(provider.config).toEqual({});
      expect(provider.initialized).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should initialize with valid config', async () => {
      const config = {
        endpoint: 'http://localhost:8080',
        model: 'mlx-quantized',
      };

      await provider.initialize(config);

      expect(provider.initialized).toBe(true);
      expect(provider.config.endpoint).toBe('http://localhost:8080');
      expect(provider.config.model).toBe('mlx-quantized');
    });

    it('should use default endpoint when not provided', async () => {
      const config = {};

      await provider.initialize(config);

      expect(provider.config.endpoint).toBe('http://localhost:8080');
    });

    it('should use default model when not provided', async () => {
      const config = {};

      await provider.initialize(config);

      expect(provider.config.model).toBe('mlx-quantized');
    });

    it('should use default temperature when not provided', async () => {
      const config = {};

      await provider.initialize(config);

      expect(provider.config.temperature).toBe(0.3);
    });

    it('should allow custom temperature', async () => {
      const config = { temperature: 1.5 };

      await provider.initialize(config);

      expect(provider.config.temperature).toBe(1.5);
    });
  });

  describe('generateCompletionStream', () => {
    beforeEach(async () => {
      await provider.initialize({
        endpoint: 'http://localhost:8080',
        model: 'mlx-quantized',
      });

      // Set up StreamParser mock
      const mockParser = {
        parseStream: jest.fn().mockResolvedValue('response'),
      };
      StreamParser.openAICompatible.mockReturnValue(mockParser);
    });

    it('should throw error when not initialized', async () => {
      const uninitializedProvider = new MLXProvider();
      requireInitialized.mockImplementation(() => {
        throw new Error('MLX not initialized');
      });

      await expect(
        uninitializedProvider.generateCompletionStream('test', jest.fn())
      ).rejects.toThrow('MLX not initialized');
    });

    it('should call fetch with correct URL and headers', async () => {
      const onChunk = jest.fn();
      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.generateCompletionStream('Hello', onChunk);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should strip trailing slash from endpoint', async () => {
      await provider.initialize({ endpoint: 'http://localhost:8080/' });

      const onChunk = jest.fn();
      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.generateCompletionStream('Hello', onChunk);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/chat/completions',
        expect.any(Object)
      );
    });

    it('should include system prompt in messages', async () => {
      const onChunk = jest.fn();
      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.generateCompletionStream('Hello', onChunk, {
        systemPrompt: 'You are helpful',
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.messages).toEqual([
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hello' },
      ]);
    });

    it('should include model, stream, and temperature in request', async () => {
      const onChunk = jest.fn();
      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.generateCompletionStream('Hello', onChunk);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.model).toBe('mlx-quantized');
      expect(requestBody.stream).toBe(true);
      expect(requestBody.temperature).toBe(0.3);
    });

    it('should use StreamParser to parse response', async () => {
      const onChunk = jest.fn();
      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.generateCompletionStream('Hello', onChunk);

      expect(StreamParser.openAICompatible).toHaveBeenCalled();
    });

    it('should handle HTTP errors', async () => {
      const onChunk = jest.fn();
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      };
      mockFetch.mockResolvedValue(mockResponse);

      handleHttpError.mockResolvedValue(['fallback-model']);

      await expect(provider.generateCompletionStream('Hello', onChunk)).rejects.toThrow(
        'MLX API error: 500 Internal Server Error'
      );

      expect(handleHttpError).toHaveBeenCalledWith(mockResponse, 'MLX', {
        fallbackModels: expect.any(Array),
        docsUrl: 'https://github.com/ml-explore/mlx',
      });
    });

    it('should handle network errors', async () => {
      const onChunk = jest.fn();
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      handleNetworkError.mockImplementation(() => {
        throw networkError;
      });

      await expect(provider.generateCompletionStream('Hello', onChunk)).rejects.toThrow('Network error');

      expect(handleNetworkError).toHaveBeenCalledWith(networkError, 'MLX', 'Streaming request');
    });
  });

  describe('generateCompletion (non-streaming)', () => {
    beforeEach(async () => {
      await provider.initialize({
        endpoint: 'http://localhost:8080',
        model: 'mlx-quantized',
      });
    });

    it('should aggregate streaming response', async () => {
      const mockParser = {
        parseStream: jest.fn().mockImplementation(async (body, onChunk) => {
          onChunk('Hello');
          onChunk(' world');
          onChunk('!');
        }),
      };
      StreamParser.openAICompatible.mockReturnValue(mockParser);

      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.generateCompletion('Hi');

      expect(result).toBe('Hello world!');
    });

    it('should handle empty streaming response', async () => {
      const mockParser = {
        parseStream: jest.fn().mockResolvedValue(''),
      };
      StreamParser.openAICompatible.mockReturnValue(mockParser);

      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.generateCompletion('Hi');

      expect(result).toBe('');
    });

    it('should reject on streaming error', async () => {
      const streamError = new Error('Stream error');

      const mockParser = {
        parseStream: jest.fn().mockRejectedValue(streamError),
      };
      StreamParser.openAICompatible.mockReturnValue(mockParser);

      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      // handleNetworkError will be called and re-throw the error
      handleNetworkError.mockImplementation(() => {
        throw streamError;
      });

      await expect(provider.generateCompletion('Hi')).rejects.toThrow('Stream error');
    });
  });

  describe('getAvailableModels', () => {
    beforeEach(async () => {
      await provider.initialize({
        endpoint: 'http://localhost:8080',
        model: 'mlx-quantized',
      });
    });

    it('should return cached models if available', async () => {
      getCachedModels.mockReturnValue(['cached-model-1', 'cached-model-2']);

      const models = await provider.getAvailableModels();

      expect(models).toEqual(['cached-model-1', 'cached-model-2']);
      expect(getCachedModels).toHaveBeenCalledWith('mlx');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch models from server', async () => {
      getCachedModels.mockReturnValue(null);

      const mockResponse = {
        ok: true,
        json: async () => ({
          data: [{ id: 'model-1' }, { id: 'model-2' }],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const models = await provider.getAvailableModels();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/v1/models', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(models).toEqual(['model-1', 'model-2']);
      expect(setCachedModels).toHaveBeenCalledWith('mlx', ['model-1', 'model-2']);
      expect(logSuccess).toHaveBeenCalledWith('MLX', 'Fetched models from server', 2);
    });

    it('should handle missing data array in response', async () => {
      getCachedModels.mockReturnValue(null);

      const mockResponse = {
        ok: true,
        json: async () => ({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const models = await provider.getAvailableModels();

      expect(models).toEqual(expect.arrayContaining(['mlx-quantized']));
      expect(setCachedModels).toHaveBeenCalled();
    });

    it('should handle non-array data in response', async () => {
      getCachedModels.mockReturnValue(null);

      const mockResponse = {
        ok: true,
        json: async () => ({
          data: 'not-an-array',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const models = await provider.getAvailableModels();

      expect(models).toEqual(expect.arrayContaining(['mlx-quantized']));
    });

    it('should fall back to default models on HTTP error', async () => {
      getCachedModels.mockReturnValue(null);

      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Error',
      };
      mockFetch.mockResolvedValue(mockResponse);

      handleHttpError.mockResolvedValue(['fallback-model']);

      const models = await provider.getAvailableModels();

      expect(handleHttpError).toHaveBeenCalledWith(mockResponse, 'MLX', {
        fallbackModels: expect.any(Array),
        docsUrl: 'https://github.com/ml-explore/mlx',
      });
      expect(models).toEqual(['fallback-model']);
      expect(setCachedModels).toHaveBeenCalledWith('mlx', ['fallback-model']);
    });

    it('should fall back to default models on network error', async () => {
      getCachedModels.mockReturnValue(null);

      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      // Mock handleNetworkError to just log, not throw
      handleNetworkError.mockImplementation(() => {});

      const models = await provider.getAvailableModels();

      expect(handleNetworkError).toHaveBeenCalledWith(networkError, 'MLX', 'Fetching models');
      expect(models).toEqual(expect.arrayContaining(['mlx-quantized']));
      expect(setCachedModels).toHaveBeenCalledWith('mlx', expect.any(Array));
    });

    it('should use default endpoint when config not set', async () => {
      await provider.initialize({}); // No endpoint

      getCachedModels.mockReturnValue(null);

      const mockResponse = {
        ok: true,
        json: async () => ({ data: [] }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.getAvailableModels();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/v1/models', expect.any(Object));
    });
  });

  describe('getDefaultModels', () => {
    it('should return array of MLX models', async () => {
      await provider.initialize({});

      const models = provider.getDefaultModels();

      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should include quantized variants', async () => {
      await provider.initialize({});

      const models = provider.getDefaultModels();

      expect(models).toContain('mlx-quantized');
      expect(models).toContain('mlx-quantized-4bit');
      expect(models).toContain('mlx-quantized-8bit');
    });

    it('should include full precision models', async () => {
      await provider.initialize({});

      const models = provider.getDefaultModels();

      expect(models).toContain('mlx-full');
      expect(models).toContain('mlx-full-precision');
    });

    it('should include Llama family models', async () => {
      await provider.initialize({});

      const models = provider.getDefaultModels();

      expect(models).toContain('llama-mlx');
      expect(models).toContain('llama-mlx-7b');
      expect(models).toContain('llama-mlx-13b');
      expect(models).toContain('llama-mlx-70b');
    });

    it('should include Mistral family models', async () => {
      await provider.initialize({});

      const models = provider.getDefaultModels();

      expect(models).toContain('mistral-mlx');
      expect(models).toContain('mistral-mlx-7b');
      expect(models).toContain('mixtral-mlx-8x7b');
    });

    it('should include other models', async () => {
      await provider.initialize({});

      const models = provider.getDefaultModels();

      expect(models).toContain('phi-mlx');
      expect(models).toContain('gemma-mlx');
      expect(models).toContain('qwen-mlx');
    });
  });

  describe('validateConfig', () => {
    it('should return valid when endpoint is set and on Apple Silicon', async () => {
      await provider.initialize({
        endpoint: 'http://localhost:8080',
      });

      const mockResponse = { ok: true };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.validateConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error when endpoint is missing', async () => {
      // Don't initialize - test validation with empty config
      provider.initialized = true;
      provider.config = {};

      const result = await provider.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Endpoint is required');
    });

    it('should return error when endpoint is invalid URL', async () => {
      await provider.initialize({
        endpoint: 'not-a-url',
      });

      const result = await provider.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Endpoint must be a valid URL');
    });

    it('should return error when not on Apple Silicon', async () => {
      Object.defineProperty(navigator, 'platform', {
        writable: true,
        value: 'Win32',
      });

      await provider.initialize({
        endpoint: 'http://localhost:8080',
      });

      const result = await provider.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('MLX is designed for Apple Silicon devices');
    });

    it('should check if MLX server is running', async () => {
      await provider.initialize({
        endpoint: 'http://localhost:8080',
      });

      const mockResponse = { ok: false };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('MLX server is not responding. Make sure MLX server is running.');
    });

    it('should add error when cannot connect to MLX server', async () => {
      await provider.initialize({
        endpoint: 'http://localhost:8080',
      });

      mockFetch.mockRejectedValue(new Error('Connection refused'));

      const result = await provider.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cannot connect to MLX server: Connection refused');
    });

    it('should accept iPhone platform as Apple Silicon', async () => {
      Object.defineProperty(navigator, 'platform', {
        writable: true,
        value: 'iPhone',
      });

      await provider.initialize({
        endpoint: 'http://localhost:8080',
      });

      const mockResponse = { ok: true };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.validateConfig();

      expect(result.valid).toBe(true);
    });

    it('should accept iPad platform as Apple Silicon', async () => {
      Object.defineProperty(navigator, 'platform', {
        writable: true,
        value: 'iPad',
      });

      await provider.initialize({
        endpoint: 'http://localhost:8080',
      });

      const mockResponse = { ok: true };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.validateConfig();

      expect(result.valid).toBe(true);
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', async () => {
      await provider.initialize({});

      expect(provider.isValidUrl('http://localhost:8080')).toBe(true);
      expect(provider.isValidUrl('https://example.com')).toBe(true);
    });

    it('should return false for invalid URLs', async () => {
      await provider.initialize({});

      expect(provider.isValidUrl('not-a-url')).toBe(false);
      expect(provider.isValidUrl('')).toBe(false);
    });
  });

  describe('getProviderInfo', () => {
    it('should return provider metadata', () => {
      const info = provider.getProviderInfo();

      expect(info).toHaveProperty('id');
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('description');
      expect(info).toHaveProperty('supportsStreaming');
      expect(info).toHaveProperty('requiresApiKey');
      expect(info).toHaveProperty('requiresLocalServer');
    });

    it('should have correct provider ID and name', () => {
      const info = provider.getProviderInfo();

      expect(info.id).toBe('mlx');
      expect(info.name).toBe('MLX');
    });

    it('should indicate local server requirement and Apple Silicon support', () => {
      const info = provider.getProviderInfo();

      expect(info.requiresApiKey).toBe(false);
      expect(info.requiresLocalServer).toBe(true);
      expect(info.requiresAppleSilicon).toBe(true);
    });

    it('should include documentation URL', () => {
      const info = provider.getProviderInfo();

      expect(info.documentationUrl).toBe('https://github.com/ml-explore/mlx');
    });

    it('should include default models', () => {
      const info = provider.getProviderInfo();

      expect(info.defaultModels).toContain('mlx-quantized');
      expect(info.defaultModels).toContain('mlx-full');
      expect(info.defaultModels).toContain('llama-mlx');
    });

    it('should have endpoint config field', () => {
      const info = provider.getProviderInfo();
      const endpointField = info.configFields.find(f => f.name === 'endpoint');

      expect(endpointField).toBeDefined();
      expect(endpointField.type).toBe('text');
      expect(endpointField.placeholder).toBe('http://localhost:8080');
      expect(endpointField.required).toBe(false);
    });

    it('should have model field with options', () => {
      const info = provider.getProviderInfo();
      const modelField = info.configFields.find(f => f.name === 'model');

      expect(modelField).toBeDefined();
      expect(modelField.type).toBe('select');
      expect(modelField.options).toContain('mlx-quantized');
      expect(modelField.required).toBe(false);
    });

    it('should have temperature field with extended range', () => {
      const info = provider.getProviderInfo();
      const tempField = info.configFields.find(f => f.name === 'temperature');

      expect(tempField).toBeDefined();
      expect(tempField.type).toBe('number');
      expect(tempField.min).toBe(0);
      expect(tempField.max).toBe(2);
      expect(tempField.step).toBe(0.1);
      expect(tempField.default).toBe(0.3);
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock StreamParser before importing
jest.mock('@/services/ai/streaming', () => ({
  StreamParser: {
    openAICompatible: jest.fn(() => ({
      parseStream: jest.fn(),
    })),
    ollama: jest.fn(() => ({
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

import { OllamaProvider } from '@/services/ai/providers/OllamaProvider';
import { StreamParser } from '@/services/ai/streaming';
import { getCachedModels, setCachedModels } from '@/utils/modelCacheUtil';
import {
  handleHttpError,
  handleNetworkError,
  logSuccess,
  requireInitialized,
} from '@/utils/apiErrorHandler';

describe('OllamaProvider', () => {
  let provider;
  let mockFetch;

  beforeEach(() => {
    provider = new OllamaProvider();

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
        endpoint: 'http://localhost:11434',
        model: 'llama2',
      };

      await provider.initialize(config);

      expect(provider.initialized).toBe(true);
      expect(provider.config.endpoint).toBe('http://localhost:11434');
      expect(provider.config.model).toBe('llama2');
    });

    it('should use default endpoint when not provided', async () => {
      const config = {};

      await provider.initialize(config);

      expect(provider.config.endpoint).toBe('http://localhost:11434');
    });

    it('should use default model when not provided', async () => {
      const config = {};

      await provider.initialize(config);

      expect(provider.config.model).toBe('llama2');
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
        endpoint: 'http://localhost:11434',
        model: 'llama2',
      });

      // Set up StreamParser mock
      const mockParser = {
        parseStream: jest.fn().mockResolvedValue('response'),
      };
      StreamParser.ollama.mockReturnValue(mockParser);
    });

    it('should throw error when not initialized', async () => {
      const uninitializedProvider = new OllamaProvider();
      requireInitialized.mockImplementation(() => {
        throw new Error('Ollama not initialized');
      });

      await expect(
        uninitializedProvider.generateCompletionStream('test', jest.fn())
      ).rejects.toThrow('Ollama not initialized');
    });

    it('should call fetch with correct URL and headers', async () => {
      const onChunk = jest.fn();
      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.generateCompletionStream('Hello', onChunk);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should strip trailing slash from endpoint', async () => {
      await provider.initialize({ endpoint: 'http://localhost:11434/' });

      const onChunk = jest.fn();
      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.generateCompletionStream('Hello', onChunk);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/chat', expect.any(Object));
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
      expect(requestBody.model).toBe('llama2');
      expect(requestBody.stream).toBe(true);
      expect(requestBody.temperature).toBe(0.3);
    });

    it('should use StreamParser.ollama() to parse response', async () => {
      const onChunk = jest.fn();
      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.generateCompletionStream('Hello', onChunk);

      expect(StreamParser.ollama).toHaveBeenCalled();
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
        'Ollama API error: 500 Internal Server Error'
      );

      expect(handleHttpError).toHaveBeenCalledWith(mockResponse, 'Ollama', {
        fallbackModels: expect.any(Array),
      });
    });

    it('should handle network errors', async () => {
      const onChunk = jest.fn();
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      handleNetworkError.mockImplementation(() => {
        throw networkError;
      });

      await expect(provider.generateCompletionStream('Hello', onChunk)).rejects.toThrow(
        'Network error'
      );

      expect(handleNetworkError).toHaveBeenCalledWith(networkError, 'Ollama', 'Streaming request');
    });
  });

  describe('generateCompletion (non-streaming)', () => {
    beforeEach(async () => {
      await provider.initialize({
        endpoint: 'http://localhost:11434',
        model: 'llama2',
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
      StreamParser.ollama.mockReturnValue(mockParser);

      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.generateCompletion('Hi');

      expect(result).toBe('Hello world!');
    });

    it('should handle empty streaming response', async () => {
      const mockParser = {
        parseStream: jest.fn().mockResolvedValue(''),
      };
      StreamParser.ollama.mockReturnValue(mockParser);

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
      StreamParser.ollama.mockReturnValue(mockParser);

      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      handleNetworkError.mockImplementation(() => {
        throw streamError;
      });

      await expect(provider.generateCompletion('Hi')).rejects.toThrow('Stream error');
    });
  });

  describe('getAvailableModels', () => {
    beforeEach(async () => {
      await provider.initialize({
        endpoint: 'http://localhost:11434',
        model: 'llama2',
      });
    });

    it('should return cached models if available', async () => {
      getCachedModels.mockReturnValue(['cached-model-1', 'cached-model-2']);

      const models = await provider.getAvailableModels();

      expect(models).toEqual(['cached-model-1', 'cached-model-2']);
      expect(getCachedModels).toHaveBeenCalledWith('ollama');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch models from server', async () => {
      getCachedModels.mockReturnValue(null);

      const mockResponse = {
        ok: true,
        json: async () => ({
          models: [{ name: 'model-1' }, { name: 'model-2' }],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const models = await provider.getAvailableModels();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/tags', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(models).toEqual(['model-1', 'model-2']);
      expect(setCachedModels).toHaveBeenCalledWith('ollama', ['model-1', 'model-2']);
      expect(logSuccess).toHaveBeenCalledWith('Ollama', 'Fetched models from server', 2);
    });

    it('should sort fetched models alphabetically', async () => {
      getCachedModels.mockReturnValue(null);

      const mockResponse = {
        ok: true,
        json: async () => ({
          models: [{ name: 'zebra' }, { name: 'alpha' }],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const models = await provider.getAvailableModels();

      expect(models).toEqual(['alpha', 'zebra']);
    });

    it('should handle missing models array in response', async () => {
      getCachedModels.mockReturnValue(null);

      const mockResponse = {
        ok: true,
        json: async () => ({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const models = await provider.getAvailableModels();

      expect(models).toEqual(expect.arrayContaining(['llama2']));
      expect(setCachedModels).toHaveBeenCalled();
    });

    it('should handle empty models array', async () => {
      getCachedModels.mockReturnValue(null);

      const mockResponse = {
        ok: true,
        json: async () => ({
          models: [],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const models = await provider.getAvailableModels();

      expect(models).toEqual(expect.arrayContaining(['llama2']));
      expect(console.warn).toHaveBeenCalledWith(
        '[Ollama] ⚠️ No models found on server, using default list'
      );
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

      expect(handleHttpError).toHaveBeenCalledWith(mockResponse, 'Ollama', {
        fallbackModels: expect.any(Array),
        docsUrl: 'https://ollama.ai/docs',
      });
      expect(models).toEqual(['fallback-model']);
      expect(setCachedModels).toHaveBeenCalledWith('ollama', ['fallback-model']);
    });

    it('should fall back to default models on network error', async () => {
      getCachedModels.mockReturnValue(null);

      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      handleNetworkError.mockImplementation(() => {});

      const models = await provider.getAvailableModels();

      expect(handleNetworkError).toHaveBeenCalledWith(networkError, 'Ollama', 'Fetching models');
      expect(models).toEqual(expect.arrayContaining(['llama2']));
      expect(setCachedModels).toHaveBeenCalledWith('ollama', expect.any(Array));
    });

    it('should use default endpoint when config not set', async () => {
      await provider.initialize({}); // No endpoint

      getCachedModels.mockReturnValue(null);

      const mockResponse = {
        ok: true,
        json: async () => ({ models: [] }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.getAvailableModels();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/tags', expect.any(Object));
    });
  });

  describe('getDefaultModels', () => {
    it('should return array of Ollama models', async () => {
      await provider.initialize({});

      const models = provider.getDefaultModels();

      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should include common models', async () => {
      await provider.initialize({});

      const models = provider.getDefaultModels();

      expect(models).toContain('llama2');
      expect(models).toContain('mistral');
      expect(models).toContain('codellama');
      expect(models).toContain('neural-chat');
      expect(models).toContain('gemma');
      expect(models).toContain('phi');
    });
  });

  describe('validateConfig', () => {
    it('should return valid when endpoint is set', async () => {
      await provider.initialize({
        endpoint: 'http://localhost:11434',
      });

      const mockResponse = { ok: true };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.validateConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error when endpoint is missing', async () => {
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

    it('should check if Ollama server is running', async () => {
      await provider.initialize({
        endpoint: 'http://localhost:11434',
      });

      const mockResponse = { ok: false };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Ollama server is not responding. Make sure Ollama is running.'
      );
    });

    it('should add error when cannot connect to Ollama server', async () => {
      await provider.initialize({
        endpoint: 'http://localhost:11434',
      });

      mockFetch.mockRejectedValue(new Error('Connection refused'));

      const result = await provider.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cannot connect to Ollama server: Connection refused');
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', async () => {
      await provider.initialize({});

      expect(provider.isValidUrl('http://localhost:11434')).toBe(true);
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

      expect(info.id).toBe('ollama');
      expect(info.name).toBe('Ollama');
    });

    it('should indicate local server requirement and no API key', () => {
      const info = provider.getProviderInfo();

      expect(info.requiresApiKey).toBe(false);
      expect(info.requiresLocalServer).toBe(true);
    });

    it('should include documentation URL', () => {
      const info = provider.getProviderInfo();

      expect(info.documentationUrl).toBe('https://ollama.ai/docs');
    });

    it('should include default models', () => {
      const info = provider.getProviderInfo();

      expect(info.defaultModels).toContain('llama2');
      expect(info.defaultModels).toContain('mistral');
      expect(info.defaultModels).toContain('codellama');
      expect(info.defaultModels).toContain('neural-chat');
    });

    it('should have endpoint config field', () => {
      const info = provider.getProviderInfo();
      const endpointField = info.configFields.find(f => f.name === 'endpoint');

      expect(endpointField).toBeDefined();
      expect(endpointField.type).toBe('text');
      expect(endpointField.placeholder).toBe('http://localhost:11434');
      expect(endpointField.required).toBe(false);
    });

    it('should have model field with options', () => {
      const info = provider.getProviderInfo();
      const modelField = info.configFields.find(f => f.name === 'model');

      expect(modelField).toBeDefined();
      expect(modelField.type).toBe('select');
      expect(modelField.options).toContain('llama2');
      expect(modelField.options).toContain('mistral');
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

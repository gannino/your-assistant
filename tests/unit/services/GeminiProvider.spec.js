import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock @google/genai SDK before importing
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContentStream: jest.fn(),
      generateContent: jest.fn(),
    },
  })),
}));

// Mock corsProxyUtil
jest.mock('@/utils/corsProxyUtil', () => ({
  fetchWithCorsProxy: jest.fn(),
}));

// Mock aiErrorHandler
jest.mock('@/utils/aiErrorHandler', () => ({
  validateProviderConfig: jest.fn((config, name) => {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
  }),
  createNotInitializedError: jest.fn(name => new Error(`${name} not initialized`)),
  handleProviderError: jest.fn((error, name) => error),
  createInitializationError: jest.fn((name, error) => error),
}));

import { GeminiProvider } from '@/services/ai/providers/GeminiProvider';
import { GoogleGenAI } from '@google/genai';
import { fetchWithCorsProxy } from '@/utils/corsProxyUtil';

describe('GeminiProvider', () => {
  let provider;
  let mockClient;
  let mockValidateProviderConfig;

  beforeEach(() => {
    provider = new GeminiProvider();

    // Get the mocked client
    const MockGenAI = require('@google/genai').GoogleGenAI;
    mockClient = new MockGenAI();

    // Get mock reference
    mockValidateProviderConfig = require('@/utils/aiErrorHandler').validateProviderConfig;

    // Reset mock to default (pass validation)
    mockValidateProviderConfig.mockImplementation(() => {});

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
      expect(provider.client).toBeNull();
      expect(provider.modelsCache).toBeNull();
      expect(provider.modelsCacheTime).toBeNull();
    });

    it('should set CACHE_DURATION to 5 minutes', () => {
      expect(provider.CACHE_DURATION).toBe(5 * 60 * 1000);
    });
  });

  describe('initialize', () => {
    it('should initialize with valid config', async () => {
      const config = {
        apiKey: 'test-api-key',
        model: 'gemini-1.5-flash',
      };

      await provider.initialize(config);

      expect(provider.initialized).toBe(true);
      expect(provider.config.apiKey).toBe('test-api-key');
      expect(provider.config.model).toBe('gemini-1.5-flash');
      expect(provider.client).not.toBeNull();
    });

    it('should use default model when not provided', async () => {
      const config = { apiKey: 'test-api-key' };

      await provider.initialize(config);

      expect(provider.config.model).toBe('gemini-1.5-flash');
    });

    it('should use default temperature when not provided', async () => {
      const config = { apiKey: 'test-api-key' };

      await provider.initialize(config);

      expect(provider.config.temperature).toBe(0.3);
    });

    it('should allow custom temperature', async () => {
      const config = { apiKey: 'test-api-key', temperature: 0.8 };

      await provider.initialize(config);

      expect(provider.config.temperature).toBe(0.8);
    });

    it('should create GoogleGenAI client', async () => {
      const config = { apiKey: 'test-key' };

      await provider.initialize(config);

      expect(GoogleGenAI).toHaveBeenCalledWith({
        apiKey: 'test-key',
      });
    });

    it('should throw error when validation fails', async () => {
      const testProvider = new GeminiProvider();

      mockValidateProviderConfig.mockImplementation(() => {
        throw new Error('API key is required');
      });

      await expect(testProvider.initialize({})).rejects.toThrow('API key is required');

      mockValidateProviderConfig.mockImplementation(() => {});
    });
  });

  describe('_buildParts', () => {
    beforeEach(async () => {
      await provider.initialize({ apiKey: 'test-key' });
    });

    it('should return parts array with text only', () => {
      const parts = provider._buildParts('Hello world', []);

      expect(parts).toEqual([{ text: 'Hello world' }]);
    });

    it('should add image parts before text', () => {
      const imageDataUrls = ['data:image/png;base64,abc123'];

      const parts = provider._buildParts('Describe this', imageDataUrls);

      expect(parts).toHaveLength(2);
      expect(parts[0]).toEqual({
        inlineData: { mimeType: 'image/png', data: 'abc123' },
      });
      expect(parts[1]).toEqual({ text: 'Describe this' });
    });

    it('should handle multiple images', () => {
      const imageDataUrls = ['data:image/png;base64,abc123', 'data:image/jpeg;base64,def456'];

      const parts = provider._buildParts('Compare these', imageDataUrls);

      expect(parts).toHaveLength(3);
      expect(parts[0]).toEqual({
        inlineData: { mimeType: 'image/png', data: 'abc123' },
      });
      expect(parts[1]).toEqual({
        inlineData: { mimeType: 'image/jpeg', data: 'def456' },
      });
      expect(parts[2]).toEqual({ text: 'Compare these' });
    });

    it('should extract mime type from data URL', () => {
      const parts = provider._buildParts('Test', ['data:image/webp;base64,xyz']);

      expect(parts[0].inlineData.mimeType).toBe('image/webp');
    });

    it('should default to image/png if mime type not found', () => {
      const parts = provider._buildParts('Test', ['data:base64,abc']);

      expect(parts[0].inlineData.mimeType).toBe('image/png');
    });
  });

  describe('generateCompletionStream', () => {
    const { createNotInitializedError } = require('@/utils/aiErrorHandler');

    beforeEach(async () => {
      await provider.initialize({
        apiKey: 'test-api-key',
        model: 'gemini-1.5-flash',
      });

      // Re-apply mock after parent beforeEach clears it
      // Need to set up default mock that returns empty generator
      async function* defaultGenerator() {
        yield { text: '' };
      }

      const MockGenAI = require('@google/genai').GoogleGenAI;
      const freshMockClient = new MockGenAI();
      freshMockClient.models.generateContentStream.mockResolvedValue(defaultGenerator());

      provider.client = freshMockClient;
      mockClient = freshMockClient;
    });

    it('should throw error when not initialized', async () => {
      const uninitializedProvider = new GeminiProvider();
      createNotInitializedError.mockReturnValue(new Error('Gemini not initialized'));

      await expect(
        uninitializedProvider.generateCompletionStream('test', jest.fn())
      ).rejects.toThrow('Gemini not initialized');
    });

    it('should call client streaming method', async () => {
      const onChunk = jest.fn();

      async function* mockGenerator() {
        yield { text: 'Hello' };
        yield { text: ' world' };
      }

      mockClient.models.generateContentStream.mockResolvedValue(mockGenerator());

      await provider.generateCompletionStream('Hi', onChunk);

      expect(mockClient.models.generateContentStream).toHaveBeenCalled();
    });

    it('should include system instruction in request', async () => {
      const onChunk = jest.fn();

      async function* mockGenerator() {
        yield { text: 'Response' };
      }

      mockClient.models.generateContentStream.mockResolvedValue(mockGenerator());

      await provider.generateCompletionStream('Hi', onChunk, {
        systemPrompt: 'You are a helpful assistant',
      });

      const callArgs = mockClient.models.generateContentStream.mock.calls[0][0];
      expect(callArgs.config.systemInstruction).toEqual({
        parts: [{ text: 'You are a helpful assistant' }],
      });
    });

    it('should include images in request', async () => {
      const onChunk = jest.fn();

      async function* mockGenerator() {
        yield { text: 'Image description' };
      }

      mockClient.models.generateContentStream.mockResolvedValue(mockGenerator());

      await provider.generateCompletionStream('Describe this', onChunk, {
        imageDataUrls: ['data:image/png;base64,abc123'],
      });

      const callArgs = mockClient.models.generateContentStream.mock.calls[0][0];
      expect(callArgs.contents[0].parts).toHaveLength(2);
    });

    it('should call onChunk for each chunk', async () => {
      const onChunk = jest.fn();

      async function* mockGenerator() {
        yield { text: 'Hello' };
        yield { text: ' world' };
        yield { text: '!' };
      }

      mockClient.models.generateContentStream.mockResolvedValue(mockGenerator());

      await provider.generateCompletionStream('Hi', onChunk);

      expect(onChunk).toHaveBeenCalledWith('Hello');
      expect(onChunk).toHaveBeenCalledWith(' world');
      expect(onChunk).toHaveBeenCalledWith('!');
      expect(onChunk).toHaveBeenCalledTimes(3);
    });

    it('should handle chunks without text', async () => {
      const onChunk = jest.fn();

      async function* mockGenerator() {
        yield {};
        yield { text: 'Response' };
        yield { text: null };
      }

      mockClient.models.generateContentStream.mockResolvedValue(mockGenerator());

      await provider.generateCompletionStream('Hi', onChunk);

      expect(onChunk).toHaveBeenCalledTimes(1);
      expect(onChunk).toHaveBeenCalledWith('Response');
    });

    it('should set model in request', async () => {
      const onChunk = jest.fn();

      async function* mockGenerator() {
        yield { text: 'Test' };
      }

      // Re-initialize with different model
      await provider.initialize({
        apiKey: 'test-key',
        model: 'gemini-2.0-flash',
      });

      // Re-apply mock after initialize
      const MockGenAI = require('@google/genai').GoogleGenAI;
      const freshMockClient = new MockGenAI();
      freshMockClient.models.generateContentStream.mockResolvedValue(mockGenerator());
      provider.client = freshMockClient;

      await provider.generateCompletionStream('Hi', onChunk);

      const callArgs = freshMockClient.models.generateContentStream.mock.calls[0][0];
      expect(callArgs.model).toBe('gemini-2.0-flash');
    });

    it('should set temperature in request', async () => {
      const onChunk = jest.fn();

      async function* mockGenerator() {
        yield { text: 'Test' };
      }

      // Re-initialize with different temperature
      await provider.initialize({
        apiKey: 'test-key',
        temperature: 0.7,
      });

      // Re-apply mock after initialize
      const MockGenAI = require('@google/genai').GoogleGenAI;
      const freshMockClient = new MockGenAI();
      freshMockClient.models.generateContentStream.mockResolvedValue(mockGenerator());
      provider.client = freshMockClient;

      await provider.generateCompletionStream('Hi', onChunk);

      const callArgs = freshMockClient.models.generateContentStream.mock.calls[0][0];
      expect(callArgs.config.generationConfig.temperature).toBe(0.7);
    });
  });

  describe('generateCompletion (non-streaming)', () => {
    beforeEach(async () => {
      await provider.initialize({
        apiKey: 'test-api-key',
        model: 'gemini-1.5-flash',
      });
    });
    beforeEach(async () => {
      await provider.initialize({
        apiKey: 'test-api-key',
        model: 'gemini-1.5-flash',
      });

      // Re-apply mock after parent beforeEach clears it
      const MockGenAI = require('@google/genai').GoogleGenAI;
      const freshMockClient = new MockGenAI();
      freshMockClient.models.generateContent.mockResolvedValue({ text: '' });

      provider.client = freshMockClient;
      mockClient = freshMockClient;
    });

    it('should call client non-streaming method', async () => {
      mockClient.models.generateContent.mockResolvedValue({
        text: 'Test response',
      });

      const result = await provider.generateCompletion('Hello');

      expect(mockClient.models.generateContent).toHaveBeenCalled();
      expect(result).toBe('Test response');
    });

    it('should return empty string if no text', async () => {
      mockClient.models.generateContent.mockResolvedValue({});

      const result = await provider.generateCompletion('Hello');

      expect(result).toBe('');
    });

    it('should include system instruction in request', async () => {
      mockClient.models.generateContent.mockResolvedValue({ text: 'Response' });

      await provider.generateCompletion('Hi', {
        systemPrompt: 'System instructions',
      });

      const callArgs = mockClient.models.generateContent.mock.calls[0][0];
      expect(callArgs.config.systemInstruction).toEqual({
        parts: [{ text: 'System instructions' }],
      });
    });

    it('should include images in request', async () => {
      mockClient.models.generateContent.mockResolvedValue({ text: 'Description' });

      await provider.generateCompletion('Describe this', {
        imageDataUrls: ['data:image/png;base64,abc'],
      });

      const callArgs = mockClient.models.generateContent.mock.calls[0][0];
      expect(callArgs.contents[0].parts).toHaveLength(2);
    });

    it('should set temperature in request', async () => {
      await provider.initialize({
        apiKey: 'test-key',
        temperature: 0.5,
      });

      // Re-apply mock after initialize
      const MockGenAI = require('@google/genai').GoogleGenAI;
      const freshMockClient = new MockGenAI();
      freshMockClient.models.generateContent.mockResolvedValue({ text: 'Response' });
      provider.client = freshMockClient;

      await provider.generateCompletion('Hi');

      const callArgs = freshMockClient.models.generateContent.mock.calls[0][0];
      expect(callArgs.config.generationConfig.temperature).toBe(0.5);
    });
  });

  describe('validateConfig', () => {
    it('should return valid when API key present', async () => {
      await provider.initialize({ apiKey: 'test-key' });

      const result = await provider.validateConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error when API key missing', async () => {
      await provider.initialize({});

      const result = await provider.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API key is required');
    });
  });

  describe('getAvailableModels', () => {
    beforeEach(async () => {
      await provider.initialize({ apiKey: 'test-key' });
    });

    it('should return cached models if cache is fresh', async () => {
      provider.modelsCache = ['gemini-1.5-flash', 'gemini-1.5-pro'];
      provider.modelsCacheTime = Date.now() - 1000; // 1 second ago

      const models = await provider.getAvailableModels();

      expect(models).toEqual(['gemini-1.5-flash', 'gemini-1.5-pro']);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Using cached models'));
    });

    it('should refetch if cache is expired', async () => {
      provider.modelsCache = ['old-model'];
      provider.modelsCacheTime = Date.now() - provider.CACHE_DURATION - 1000;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [{ name: 'models/gemini-2.0-flash' }],
        }),
      });

      await provider.getAvailableModels();

      expect(console.log).toHaveBeenCalledWith('[Gemini] Cache expired, refetching models...');
    });

    it('should return hardcoded models when no API key', async () => {
      await provider.initialize({});

      const models = await provider.getAvailableModels();

      expect(models).toContain('gemini-2.0-flash');
      expect(models).toContain('gemini-1.5-flash');
      expect(models).toContain('gemini-1.5-pro');
      expect(console.log).toHaveBeenCalledWith('[Gemini] No API key, using hardcoded model list');
    });

    it('should fetch from REST API', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [{ name: 'models/gemini-2.0-flash' }, { name: 'models/gemini-1.5-pro' }],
        }),
      });

      const models = await provider.getAvailableModels();

      expect(fetch).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/models?key=test-key'
      );
      expect(models).toEqual(['gemini-1.5-pro', 'gemini-2.0-flash']);
      expect(provider.modelsCache).toEqual(models);
    });

    it('should handle 401 authentication error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const models = await provider.getAvailableModels();

      expect(console.error).toHaveBeenCalledWith('[Gemini] ❌ Authentication failed (401)');
      expect(models).toEqual(expect.arrayContaining(['gemini-2.0-flash']));
    });

    it('should handle 403 forbidden error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      });

      const models = await provider.getAvailableModels();

      expect(console.error).toHaveBeenCalledWith('[Gemini] ❌ Access forbidden (403)');
    });

    it('should handle 429 rate limit error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Too many requests',
      });

      const models = await provider.getAvailableModels();

      expect(console.warn).toHaveBeenCalledWith('[Gemini] ⚠️ Rate limited by API (429)');
    });

    it('should handle 500 server error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const models = await provider.getAvailableModels();

      expect(console.error).toHaveBeenCalledWith(
        '[Gemini] ❌ Server error (500) - Google API is experiencing issues'
      );
    });

    it('should handle 502/503 server errors', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => 'Service Unavailable',
      });

      const models = await provider.getAvailableModels();

      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Server error (503)'));
    });

    it('should fall back to CORS proxy on fetch failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('CORS error'));

      fetchWithCorsProxy.mockResolvedValue({
        json: async () => ({
          models: [{ name: 'models/gemini-1.5-flash' }],
        }),
        status: 200,
      });

      const models = await provider.getAvailableModels();

      expect(fetchWithCorsProxy).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/models?key=test-key'
      );
      expect(models).toEqual(['gemini-1.5-flash']);
    });

    it('should handle 429 from CORS proxy', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('CORS error'));

      fetchWithCorsProxy.mockResolvedValue({
        status: 429,
        json: async () => ({}),
      });

      const models = await provider.getAvailableModels();

      expect(console.warn).toHaveBeenCalledWith('[Gemini] ⚠️ Rate limited by API (429)');
      expect(models).toEqual(expect.arrayContaining(['gemini-2.0-flash']));
    });

    it('should return hardcoded models when all fetches fail', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      fetchWithCorsProxy.mockRejectedValue(new Error('Proxy error'));

      const models = await provider.getAvailableModels();

      expect(console.log).toHaveBeenCalledWith('[Gemini] Using hardcoded model list');
      expect(models).toContain('gemini-2.0-flash');
    });

    it('should cache successful fetch results', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [{ name: 'models/gemini-1.5-flash' }],
        }),
      });

      await provider.getAvailableModels();

      expect(provider.modelsCache).toEqual(['gemini-1.5-flash']);
      expect(provider.modelsCacheTime).not.toBeNull();
    });

    it('should log success on direct fetch', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [{ name: 'models/gemini-2.0-flash' }],
        }),
      });

      await provider.getAvailableModels();

      expect(console.log).toHaveBeenCalledWith('[Gemini] ✅ Fetched 1 models via direct fetch');
    });

    it('should log success on CORS proxy fetch', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('CORS'));

      fetchWithCorsProxy.mockResolvedValue({
        json: async () => ({
          models: [{ name: 'models/gemini-1.5-flash' }],
        }),
        status: 200,
      });

      await provider.getAvailableModels();

      expect(console.log).toHaveBeenCalledWith('[Gemini] ✅ Fetched 1 models via CORS proxy');
    });
  });

  describe('extractGeminiModels', () => {
    beforeEach(async () => {
      await provider.initialize({ apiKey: 'test-key' });
    });

    it('should extract model names from API response', () => {
      const data = {
        models: [{ name: 'models/gemini-2.0-flash' }, { name: 'models/gemini-1.5-pro' }],
      };

      const models = provider.extractGeminiModels(data);

      expect(models).toEqual(['gemini-1.5-pro', 'gemini-2.0-flash']);
    });

    it('should filter for gemini/flash/pro models', () => {
      const data = {
        models: [
          { name: 'models/gemini-2.0-flash' },
          { name: 'models/other-model' },
          { name: 'models/embedding-001' },
        ],
      };

      const models = provider.extractGeminiModels(data);

      expect(models).toEqual(['gemini-2.0-flash']);
    });

    it('should handle empty models array', () => {
      const models = provider.extractGeminiModels({ models: [] });

      expect(models).toEqual([]);
    });

    it('should handle missing models key', () => {
      const models = provider.extractGeminiModels({});

      expect(models).toEqual([]);
    });

    it('should handle non-array models', () => {
      const models = provider.extractGeminiModels({ models: 'not-an-array' });

      expect(models).toEqual([]);
    });

    it('should remove duplicates', () => {
      const data = {
        models: [
          { name: 'models/gemini-1.5-flash' },
          { name: 'models/gemini-1.5-flash' },
          { name: 'models/gemini-1.5-flash' },
        ],
      };

      const models = provider.extractGeminiModels(data);

      expect(models).toEqual(['gemini-1.5-flash']);
    });

    it('should sort models alphabetically', () => {
      const data = {
        models: [
          { name: 'models/gemini-2.0-flash' },
          { name: 'models/gemini-1.0-pro' },
          { name: 'models/gemini-1.5-flash' },
        ],
      };

      const models = provider.extractGeminiModels(data);

      expect(models).toEqual(['gemini-1.0-pro', 'gemini-1.5-flash', 'gemini-2.0-flash']);
    });

    it('should handle models without name', () => {
      const data = {
        models: [{ name: 'models/gemini-1.5-flash' }, { id: 'some-id' }],
      };

      const models = provider.extractGeminiModels(data);

      expect(models).toEqual(['gemini-1.5-flash']);
    });
  });

  describe('getHardcodedModels', () => {
    beforeEach(async () => {
      await provider.initialize({ apiKey: 'test-key' });
    });

    it('should return array of Gemini models', () => {
      const models = provider.getHardcodedModels();

      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should include gemini-2.0 models', () => {
      const models = provider.getHardcodedModels();

      expect(models).toContain('gemini-2.0-flash');
      expect(models).toContain('gemini-2.0-flash-lite');
      expect(models).toContain('gemini-2.0-flash-exp');
    });

    it('should include gemini-1.5 models', () => {
      const models = provider.getHardcodedModels();

      expect(models).toContain('gemini-1.5-flash');
      expect(models).toContain('gemini-1.5-flash-8b');
      expect(models).toContain('gemini-1.5-pro');
    });

    it('should include gemini-1.0 models', () => {
      const models = provider.getHardcodedModels();

      expect(models).toContain('gemini-1.0-pro');
    });
  });

  describe('getProviderInfo', () => {
    it('should return provider metadata', () => {
      const info = provider.getProviderInfo();

      expect(info).toHaveProperty('id');
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('description');
      expect(info).toHaveProperty('supportsStreaming');
      expect(info).toHaveProperty('supportsVision');
      expect(info).toHaveProperty('requiresApiKey');
    });

    it('should have correct provider ID and name', () => {
      const info = provider.getProviderInfo();

      expect(info.id).toBe('gemini');
      expect(info.name).toBe('Google Gemini');
    });

    it('should indicate streaming and vision support', () => {
      const info = provider.getProviderInfo();

      expect(info.supportsStreaming).toBe(true);
      expect(info.supportsVision).toBe(true);
    });

    it('should include SDK package name', () => {
      const info = provider.getProviderInfo();

      expect(info.sdkPackage).toBe('@google/genai');
    });

    it('should include documentation URL', () => {
      const info = provider.getProviderInfo();

      expect(info.documentationUrl).toBe('https://ai.google.dev/gemini-api/docs');
    });

    it('should include default models', () => {
      const info = provider.getProviderInfo();

      expect(info.defaultModels).toContain('gemini-2.0-flash');
      expect(info.defaultModels).toContain('gemini-1.5-flash');
      expect(info.defaultModels).toContain('gemini-1.5-pro');
    });

    it('should have apiKey config field marked required', () => {
      const info = provider.getProviderInfo();
      const apiKeyField = info.configFields.find(f => f.name === 'apiKey');

      expect(apiKeyField).toBeDefined();
      expect(apiKeyField.required).toBe(true);
      expect(apiKeyField.type).toBe('password');
    });

    it('should have model field with options', () => {
      const info = provider.getProviderInfo();
      const modelField = info.configFields.find(f => f.name === 'model');

      expect(modelField).toBeDefined();
      expect(modelField.type).toBe('select');
      expect(modelField.options).toContain('gemini-2.0-flash');
      expect(modelField.required).toBe(false);
    });

    it('should have temperature field with range', () => {
      const info = provider.getProviderInfo();
      const tempField = info.configFields.find(f => f.name === 'temperature');

      expect(tempField).toBeDefined();
      expect(tempField.type).toBe('number');
      expect(tempField.min).toBe(0);
      expect(tempField.max).toBe(1);
      expect(tempField.step).toBe(0.1);
      expect(tempField.default).toBe(0.3);
    });
  });
});

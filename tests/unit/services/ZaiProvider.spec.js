import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock StreamParser before importing ZaiProvider
jest.mock('@/services/ai/streaming', () => ({
  StreamParser: {
    openAICompatible: jest.fn(() => ({
      parseStream: jest.fn(),
    })),
  },
}));

// Mock aiErrorHandler utilities
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

import { ZaiProvider } from '@/services/ai/providers/ZaiProvider';
import { StreamParser } from '@/services/ai/streaming';

describe('ZaiProvider', () => {
  let provider;
  let mockFetch;
  let mockValidateProviderConfig;

  beforeEach(() => {
    provider = new ZaiProvider();

    // Mock fetch globally
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Get mock reference
    mockValidateProviderConfig = require('@/utils/aiErrorHandler').validateProviderConfig;

    // Reset mock implementation to default (pass validation)
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
    });
  });

  describe('initialize', () => {
    const { validateProviderConfig, createInitializationError } = require('@/utils/aiErrorHandler');

    it('should initialize with valid config', async () => {
      const config = {
        apiKey: 'test-api-key',
        model: 'glm-4.7',
        endpoint: 'https://api.z.ai/api/coding/paas/v4',
      };

      await provider.initialize(config);

      expect(provider.initialized).toBe(true);
      expect(provider.config.apiKey).toBe('test-api-key');
      expect(provider.config.model).toBe('glm-4.7');
      expect(provider.config.endpoint).toBe('https://api.z.ai/api/coding/paas/v4');
    });

    it('should use default model when not provided', async () => {
      const config = { apiKey: 'test-api-key' };

      await provider.initialize(config);

      expect(provider.config.model).toBe('glm-4.7');
    });

    it('should use default endpoint when not provided', async () => {
      const config = { apiKey: 'test-api-key' };

      await provider.initialize(config);

      expect(provider.config.endpoint).toBe('https://api.z.ai/api/coding/paas/v4');
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

    it('should throw error when validation fails', async () => {
      // Create new provider for this test
      const testProvider = new ZaiProvider();

      mockValidateProviderConfig.mockImplementation(() => {
        throw new Error('API key is required');
      });

      await expect(testProvider.initialize({})).rejects.toThrow('API key is required');

      // Reset to default implementation
      mockValidateProviderConfig.mockImplementation(() => {});
    });

    it('should call validateProviderConfig with correct params', async () => {
      const config = { apiKey: 'test-api-key' };

      await provider.initialize(config);

      expect(validateProviderConfig).toHaveBeenCalledWith(config, 'Z.ai');
    });
  });

  describe('generateCompletionStream', () => {
    const { createNotInitializedError } = require('@/utils/aiErrorHandler');
    let mockParser;

    beforeEach(async () => {
      await provider.initialize({
        apiKey: 'test-api-key',
        model: 'glm-4.7',
      });

      mockParser = {
        parseStream: jest.fn().mockResolvedValue('test response'),
      };
      StreamParser.openAICompatible.mockReturnValue(mockParser);
    });

    it('should throw error when not initialized', async () => {
      const uninitializedProvider = new ZaiProvider();
      createNotInitializedError.mockReturnValue(new Error('Z.ai not initialized'));

      await expect(
        uninitializedProvider.generateCompletionStream('test', jest.fn())
      ).rejects.toThrow('Z.ai not initialized');
    });

    it('should call fetch with correct URL and headers', async () => {
      const onChunk = jest.fn();
      const mockResponse = {
        ok: true,
        body: {},
      };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.generateCompletionStream('Hello', onChunk);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.z.ai/api/coding/paas/v4/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should handle custom endpoint with /chat/completions suffix', async () => {
      await provider.initialize({
        apiKey: 'test-api-key',
        endpoint: 'https://custom.api.com/v1/chat/completions',
      });

      const onChunk = jest.fn();
      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.generateCompletionStream('Hello', onChunk);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.api.com/v1/chat/completions',
        expect.any(Object)
      );
    });

    it('should append /chat/completions to endpoint without suffix', async () => {
      const onChunk = jest.fn();
      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.generateCompletionStream('Hello', onChunk);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.z.ai/api/coding/paas/v4/chat/completions',
        expect.any(Object)
      );
    });

    it('should include system prompt in messages', async () => {
      const onChunk = jest.fn();
      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.generateCompletionStream('Hello', onChunk, {
        systemPrompt: 'You are a helpful assistant',
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.messages).toEqual([
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' },
      ]);
    });

    it('should handle image data URLs for vision', async () => {
      const onChunk = jest.fn();
      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      const imageDataUrls = ['data:image/png;base64,abc123'];

      await provider.generateCompletionStream('Describe this image', onChunk, {
        imageDataUrls,
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.messages).toHaveLength(1);
      expect(requestBody.messages[0].role).toBe('user');
      expect(requestBody.messages[0].content).toEqual([
        { type: 'text', text: 'Describe this image' },
        {
          type: 'image_url',
          image_url: { url: 'data:image/png;base64,abc123' },
        },
      ]);
    });

    it('should handle multiple images', async () => {
      const onChunk = jest.fn();
      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      const imageDataUrls = ['data:image/png;base64,abc123', 'data:image/png;base64,def456'];

      await provider.generateCompletionStream('Compare these', onChunk, {
        imageDataUrls,
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.messages[0].content).toHaveLength(3); // text + 2 images
    });

    it('should use StreamParser to parse response', async () => {
      const onChunk = jest.fn();
      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.generateCompletionStream('Hello', onChunk);

      expect(StreamParser.openAICompatible).toHaveBeenCalled();
      expect(mockParser.parseStream).toHaveBeenCalledWith({}, onChunk);
    });

    it('should throw error on non-OK response', async () => {
      const onChunk = jest.fn();
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(provider.generateCompletionStream('Hello', onChunk)).rejects.toThrow(
        'Z.ai API error: 401 - Unauthorized'
      );
    });

    it('should log streaming request start', async () => {
      const onChunk = jest.fn();
      const mockResponse = { ok: true, body: {} };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.generateCompletionStream('Hello', onChunk);

      expect(console.log).toHaveBeenCalledWith('[Z.ai] Starting streaming request');
    });
  });

  describe('generateCompletion (non-streaming)', () => {
    beforeEach(async () => {
      await provider.initialize({
        apiKey: 'test-api-key',
        model: 'glm-4.7',
      });
    });

    it('should call fetch with stream: false', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test response' } }],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.generateCompletion('Hello');

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.stream).toBe(false);
    });

    it('should return content from response', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test response' } }],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.generateCompletion('Hello');

      expect(result).toBe('Test response');
    });

    it('should return content from data.content if choices not present', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: 'Direct content',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.generateCompletion('Hello');

      expect(result).toBe('Direct content');
    });

    it('should return empty string if no content found', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.generateCompletion('Hello');

      expect(result).toBe('');
    });

    it('should include system prompt in non-streaming request', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.generateCompletion('Hello', { systemPrompt: 'System instructions' });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.messages).toEqual([
        { role: 'system', content: 'System instructions' },
        { role: 'user', content: 'Hello' },
      ]);
    });

    it('should handle images in non-streaming request', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Image description' } }],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.generateCompletion('Describe this', {
        imageDataUrls: ['data:image/png;base64,abc'],
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.messages[0].content).toHaveLength(2);
    });

    it('should throw error on failed response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      });

      await expect(provider.generateCompletion('Hello')).rejects.toThrow(
        'Z.ai API error: 500 Internal Server Error - Server error'
      );
    });

    it('should log non-streaming request URL', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.generateCompletion('Hello');

      expect(console.log).toHaveBeenCalledWith(
        '[Z.ai Non-Streaming] Request URL:',
        'https://api.z.ai/api/coding/paas/v4/chat/completions'
      );
    });
  });

  describe('testConnection', () => {
    it('should return error when API key missing', async () => {
      // OpenAI SDK throws error when apiKey is missing
      await expect(provider.initialize({})).rejects.toThrow();

      // Provider should not be initialized
      expect(provider.initialized).toBe(false);
    });

    it('should test both /models and /chat/completions endpoints', async () => {
      await provider.initialize({
        apiKey: 'test-key',
        endpoint: 'https://api.z.ai/api/coding/paas/v4',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const result = await provider.testConnection();

      expect(mockFetch).toHaveBeenCalledTimes(1); // Stops after first success
      expect(result.success).toBe(true);
    });

    it('should return success on first successful endpoint', async () => {
      await provider.initialize({
        apiKey: 'test-key',
        endpoint: 'https://api.z.ai/v1',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await provider.testConnection();

      expect(result.success).toBe(true);
      expect(result.workingEndpoint).toBe('https://api.z.ai/v1/models');
    });

    it('should return all results when all endpoints fail', async () => {
      await provider.initialize({
        apiKey: 'test-key',
        endpoint: 'https://api.z.ai/v1',
      });

      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await provider.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('All connection tests failed');
      expect(result.allResults).toHaveLength(2);
      expect(result.suggestions).toBeDefined();
    });

    it('should include troubleshooting suggestions on failure', async () => {
      await provider.initialize({
        apiKey: 'test-key',
        endpoint: 'https://api.z.ai/api/coding/paas/v4',
      });

      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await provider.testConnection();

      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]).toContain('Verify your Z.ai API key');
    });

    it('should test with GET method and auth headers', async () => {
      await provider.initialize({
        apiKey: 'test-key',
        endpoint: 'https://api.z.ai/v1',
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      await provider.testConnection();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.z.ai/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        })
      );
    });

    it('should handle mixed success and failure', async () => {
      await provider.initialize({
        apiKey: 'test-key',
        endpoint: 'https://api.z.ai/v1',
      });

      // First endpoint fails, second succeeds
      mockFetch.mockRejectedValueOnce(new Error('Connection refused')).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await provider.testConnection();

      expect(result.success).toBe(true);
      expect(result.allResults).toHaveLength(2);
    });
  });

  describe('getTroubleshootingSuggestions', () => {
    beforeEach(async () => {
      await provider.initialize({
        apiKey: 'test-key',
        model: 'glm-4.7',
        endpoint: 'https://api.z.ai/api/coding/paas/v4',
      });
    });

    it('should return array of suggestions', () => {
      const suggestions = provider.getTroubleshootingSuggestions();

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should include API key verification', () => {
      const suggestions = provider.getTroubleshootingSuggestions();

      expect(suggestions[0]).toContain('Verify your Z.ai API key');
    });

    it('should include current endpoint in suggestions', () => {
      const suggestions = provider.getTroubleshootingSuggestions();

      const endpointSuggestion = suggestions.find(s => s.includes('Current endpoint:'));
      expect(endpointSuggestion).toBeDefined();
      expect(endpointSuggestion).toContain('https://api.z.ai/api/coding/paas/v4');
    });

    it('should include common endpoints', () => {
      const suggestions = provider.getTroubleshootingSuggestions();

      expect(suggestions.some(s => s.includes('https://api.z.ai/api/coding/paas/v4'))).toBe(true);
      expect(suggestions.some(s => s.includes('https://open.bigmodel.cn'))).toBe(true);
    });

    it('should include current model in suggestions', () => {
      const suggestions = provider.getTroubleshootingSuggestions();

      const modelSuggestion = suggestions.find(s => s.includes('Current model:'));
      expect(modelSuggestion).toBeDefined();
      expect(modelSuggestion).toContain('glm-4.7');
    });

    it('should mention CORS restrictions', () => {
      const suggestions = provider.getTroubleshootingSuggestions();

      expect(suggestions.some(s => s.includes('CORS'))).toBe(true);
    });
  });

  describe('validateConfig', () => {
    it('should return error when API key missing', async () => {
      // OpenAI SDK throws error when apiKey is missing
      await expect(provider.initialize({})).rejects.toThrow();

      // Provider should not be initialized
      expect(provider.initialized).toBe(false);
    });

    it('should return error when endpoint is invalid URL', async () => {
      await provider.initialize({
        apiKey: 'test-key',
        endpoint: 'not-a-valid-url',
      });

      const result = await provider.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Endpoint must be a valid URL');
    });

    it('should return valid with proper config', async () => {
      await provider.initialize({
        apiKey: 'test-key',
        endpoint: 'https://api.z.ai/v1',
      });

      mockFetch.mockResolvedValue({ ok: true });

      const result = await provider.validateConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should include diagnostics in result', async () => {
      await provider.initialize({
        apiKey: 'test-key',
        model: 'glm-4.6',
        endpoint: 'https://api.z.ai/v1',
      });

      const result = await provider.validateConfig();

      expect(result.diagnostics).toEqual({
        endpoint: 'https://api.z.ai/v1',
        model: 'glm-4.6',
        hasApiKey: true,
      });
    });

    it('should run connection test when config is valid', async () => {
      await provider.initialize({
        apiKey: 'test-key',
        endpoint: 'https://api.z.ai/v1',
      });

      mockFetch.mockResolvedValue({ ok: true });

      await provider.validateConfig();

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should log warning on failed connection test', async () => {
      await provider.initialize({
        apiKey: 'test-key',
        endpoint: 'https://api.z.ai/v1',
      });

      mockFetch.mockRejectedValue(new Error('Network error'));

      await provider.validateConfig();

      expect(console.warn).toHaveBeenCalledWith(
        '[Z.ai] Connection test failed:',
        expect.any(String)
      );
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(provider.isValidUrl('https://api.z.ai/v1')).toBe(true);
      expect(provider.isValidUrl('http://localhost:8080')).toBe(true);
      expect(provider.isValidUrl('https://open.bigmodel.cn/api/paas/v4')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(provider.isValidUrl('not-a-url')).toBe(false);
      expect(provider.isValidUrl('')).toBe(false);
    });
  });

  describe('getAvailableModels', () => {
    it('should return array of GLM models', async () => {
      await provider.initialize({ apiKey: 'test-key' });

      const models = await provider.getAvailableModels();

      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should include glm-4.7', async () => {
      await provider.initialize({ apiKey: 'test-key' });

      const models = await provider.getAvailableModels();

      expect(models).toContain('glm-4.7');
    });

    it('should include glm-4.6 and glm-4.5', async () => {
      await provider.initialize({ apiKey: 'test-key' });

      const models = await provider.getAvailableModels();

      expect(models).toContain('glm-4.6');
      expect(models).toContain('glm-4.5');
    });

    it('should include ari variants', async () => {
      await provider.initialize({ apiKey: 'test-key' });

      const models = await provider.getAvailableModels();

      expect(models).toContain('glm-4.7-ari');
      expect(models).toContain('glm-4.6-ari');
      expect(models).toContain('glm-4.5-ari');
    });

    it('should include common aliases', async () => {
      await provider.initialize({ apiKey: 'test-key' });

      const models = await provider.getAvailableModels();

      expect(models).toContain('glm-4');
      expect(models).toContain('glm-4-turbo');
      expect(models).toContain('glm-4-plus');
      expect(models).toContain('glm-4-air');
    });

    it('should include older GLM 3 models', async () => {
      await provider.initialize({ apiKey: 'test-key' });

      const models = await provider.getAvailableModels();

      expect(models).toContain('glm-3-turbo');
      expect(models).toContain('glm-3-plus');
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

      expect(info.id).toBe('zai');
      expect(info.name).toBe('Zhipu AI (Z.ai)');
    });

    it('should indicate streaming support and API key requirement', () => {
      const info = provider.getProviderInfo();

      expect(info.supportsStreaming).toBe(true);
      expect(info.requiresApiKey).toBe(true);
      expect(info.requiresLocalServer).toBe(false);
    });

    it('should include documentation URL', () => {
      const info = provider.getProviderInfo();

      expect(info.documentationUrl).toBe('https://z.ai');
    });

    it('should include default models', () => {
      const info = provider.getProviderInfo();

      expect(info.defaultModels).toContain('glm-4.7');
      expect(info.defaultModels).toContain('glm-4.6');
      expect(info.defaultModels).toContain('glm-4.5');
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
      expect(modelField.options).toContain('glm-4.7');
      expect(modelField.required).toBe(false);
    });

    it('should have endpoint field with placeholder', () => {
      const info = provider.getProviderInfo();
      const endpointField = info.configFields.find(f => f.name === 'endpoint');

      expect(endpointField).toBeDefined();
      expect(endpointField.type).toBe('text');
      expect(endpointField.placeholder).toBe('https://api.z.ai/api/coding/paas/v4');
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

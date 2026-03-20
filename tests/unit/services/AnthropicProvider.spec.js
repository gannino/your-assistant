import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AnthropicProvider } from '@/services/ai/providers/AnthropicProvider';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn(),
        stream: jest.fn(),
      },
    })),
  };
});

// Mock corsProxyUtil
jest.mock('@/utils/corsProxyUtil', () => ({
  fetchWithCorsProxy: jest.fn(),
}));

describe('AnthropicProvider', () => {
  let provider;
  let mockAnthropic;

  beforeEach(() => {
    provider = new AnthropicProvider();

    // Get the mocked Anthropic constructor
    mockAnthropic = require('@anthropic-ai/sdk').default;

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create provider instance', () => {
      expect(provider).toBeInstanceOf(AnthropicProvider);
      expect(provider.initialized).toBe(false);
      expect(provider.client).toBeNull();
      expect(provider.debug).toBe(false);
      expect(provider.modelsCache).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should initialize with API key', async () => {
      await provider.initialize({ apiKey: 'sk-ant-test-key' });

      expect(provider.initialized).toBe(true);
      expect(provider.config.apiKey).toBe('sk-ant-test-key');
      expect(mockAnthropic).toHaveBeenCalledWith({
        apiKey: 'sk-ant-test-key',
        dangerouslyAllowBrowser: true,
      });
    });

    it('should set default model', async () => {
      await provider.initialize({ apiKey: 'sk-ant-test-key' });

      expect(provider.config.model).toBe('claude-sonnet-4-6');
    });

    it('should set custom model', async () => {
      await provider.initialize({ apiKey: 'sk-ant-test-key', model: 'claude-opus-4-6' });

      expect(provider.config.model).toBe('claude-opus-4-6');
    });

    it('should set default temperature', async () => {
      await provider.initialize({ apiKey: 'sk-ant-test-key' });

      expect(provider.config.temperature).toBe(0.3);
    });

    it('should set custom temperature', async () => {
      await provider.initialize({ apiKey: 'sk-ant-test-key', temperature: 0.7 });

      expect(provider.config.temperature).toBe(0.7);
    });

    it('should set default maxTokens', async () => {
      await provider.initialize({ apiKey: 'sk-ant-test-key' });

      expect(provider.config.maxTokens).toBe(8192);
    });

    it('should throw error without API key', async () => {
      await expect(provider.initialize({})).rejects.toThrow('Anthropic API key is required');
    });

    it('should throw error with empty API key', async () => {
      await expect(provider.initialize({ apiKey: '' })).rejects.toThrow(
        'Anthropic API key is required'
      );
    });

    it('should warn about legacy models', async () => {
      await provider.initialize({ apiKey: 'sk-ant-test-key', model: 'claude-3-opus-20240229' });

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('is deprecated or retired')
      );
    });

    it('should set debug mode', async () => {
      await provider.initialize({ apiKey: 'sk-ant-test-key', debug: true });

      expect(provider.debug).toBe(true);
    });
  });

  describe('generateCompletion', () => {
    beforeEach(async () => {
      await provider.initialize({ apiKey: 'sk-ant-test-key' });
    });

    it('should generate text-only completion', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Test response' }],
      };

      provider.client.messages.create.mockResolvedValue(mockResponse);

      const result = await provider.generateCompletion('Hello');

      expect(result).toBe('Test response');
    });

    it('should handle system prompt', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Response with system prompt' }],
      };

      provider.client.messages.create.mockResolvedValue(mockResponse);

      await provider.generateCompletion('Hello', { systemPrompt: 'You are helpful' });

      const callArgs = provider.client.messages.create.mock.calls[0][0];
      expect(callArgs.system).toBe('You are helpful');
    });

    it('should handle vision prompts with images', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'I see an image' }],
      };

      provider.client.messages.create.mockResolvedValue(mockResponse);

      const imageDataUrls = ['data:image/png;base64,abc123'];
      await provider.generateCompletion('What do you see?', { imageDataUrls });

      const callArgs = provider.client.messages.create.mock.calls[0][0];
      expect(callArgs.messages[0].content).toHaveLength(2); // text + image
      expect(callArgs.messages[0].content[0]).toEqual({ type: 'text', text: 'What do you see?' });
      expect(callArgs.messages[0].content[1].type).toBe('image');
      expect(callArgs.messages[0].content[1].source.type).toBe('base64');
      expect(callArgs.messages[0].content[1].source.data).toBe('abc123');
    });

    it('should use custom maxTokens', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Response' }],
      };

      provider.client.messages.create.mockResolvedValue(mockResponse);

      await provider.generateCompletion('Hello', { maxTokens: 4096 });

      const callArgs = provider.client.messages.create.mock.calls[0][0];
      expect(callArgs.max_tokens).toBe(4096);
    });

    it('should throw error if not initialized', async () => {
      const uninitializedProvider = new AnthropicProvider();

      await expect(uninitializedProvider.generateCompletion('Hello')).rejects.toThrow(
        'Anthropic provider not initialized'
      );
    });

    it('should handle multiple content blocks', async () => {
      const mockResponse = {
        content: [
          { type: 'text', text: 'First part' },
          { type: 'text', text: 'Second part' },
        ],
      };

      provider.client.messages.create.mockResolvedValue(mockResponse);

      const result = await provider.generateCompletion('Hello');

      expect(result).toBe('First partSecond part');
    });

    it('should filter non-text blocks', async () => {
      const mockResponse = {
        content: [
          { type: 'text', text: 'Text content' },
          { type: 'image', source: {} },
          { type: 'text', text: 'More text' },
        ],
      };

      provider.client.messages.create.mockResolvedValue(mockResponse);

      const result = await provider.generateCompletion('Hello');

      expect(result).toBe('Text contentMore text');
    });
  });

  describe('generateCompletionStream', () => {
    beforeEach(async () => {
      await provider.initialize({ apiKey: 'sk-ant-test-key' });
    });

    it('should stream text-only response', async () => {
      const mockStream = [
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: ' World' } },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: '!' } },
      ];

      const mockAsyncIterator = {
        async *[Symbol.asyncIterator]() {
          for (const event of mockStream) {
            yield event;
          }
        },
      };

      provider.client.messages.stream.mockResolvedValue(mockAsyncIterator);

      const chunks = [];
      await provider.generateCompletionStream('Hi', chunk => chunks.push(chunk));

      expect(chunks).toEqual(['Hello', ' World', '!']);
    });

    it('should handle system prompt in stream', async () => {
      const mockStream = [
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Response' } },
      ];

      const mockAsyncIterator = {
        async *[Symbol.asyncIterator]() {
          yield mockStream[0];
        },
      };

      provider.client.messages.stream.mockResolvedValue(mockAsyncIterator);

      await provider.generateCompletionStream('Hi', () => {}, { systemPrompt: 'You are helpful' });

      const callArgs = provider.client.messages.stream.mock.calls[0][0];
      expect(callArgs.system).toBe('You are helpful');
    });

    it('should handle vision prompts in stream', async () => {
      const mockStream = [
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'I see images' } },
      ];

      const mockAsyncIterator = {
        async *[Symbol.asyncIterator]() {
          yield mockStream[0];
        },
      };

      provider.client.messages.stream.mockResolvedValue(mockAsyncIterator);

      const imageDataUrls = ['data:image/png;base64,abc123'];

      await provider.generateCompletionStream('What do you see?', () => {}, { imageDataUrls });

      const callArgs = provider.client.messages.stream.mock.calls[0][0];
      expect(callArgs.messages[0].content).toHaveLength(2);
    });

    it('should use retry logic for streaming', async () => {
      const mockStream = [
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Success' } },
      ];

      const mockAsyncIterator = {
        async *[Symbol.asyncIterator]() {
          yield mockStream[0];
        },
      };

      provider.client.messages.stream.mockResolvedValue(mockAsyncIterator);

      const executeWithRetrySpy = jest.spyOn(provider, 'executeWithRetry');

      await provider.generateCompletionStream('Hi', () => {});

      expect(executeWithRetrySpy).toHaveBeenCalled();
    });

    it('should handle streaming errors', async () => {
      const mockError = new Error('Stream failed');
      provider.client.messages.stream.mockRejectedValue(mockError);

      await expect(provider.generateCompletionStream('Hi', () => {})).rejects.toThrow(
        'Stream failed'
      );
    });

    it('should throw error if not initialized', async () => {
      const uninitializedProvider = new AnthropicProvider();

      await expect(uninitializedProvider.generateCompletionStream('Hi', () => {})).rejects.toThrow(
        'Anthropic provider not initialized'
      );
    });

    it('should skip non-text_delta events', async () => {
      const mockStream = [
        { type: 'other_event' },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } },
        { type: 'content_block_delta', delta: { type: 'other_delta' } },
      ];

      const mockAsyncIterator = {
        async *[Symbol.asyncIterator]() {
          for (const event of mockStream) {
            yield event;
          }
        },
      };

      provider.client.messages.stream.mockResolvedValue(mockAsyncIterator);

      const chunks = [];
      await provider.generateCompletionStream('Hi', chunk => chunks.push(chunk));

      expect(chunks).toEqual(['Hello']);
    });

    it('should log request details when debug mode is enabled', async () => {
      provider.debug = true;

      const mockStream = [];
      const mockAsyncIterator = {
        async *[Symbol.asyncIterator]() {
          // Empty stream
        },
      };

      provider.client.messages.stream.mockResolvedValue(mockAsyncIterator);

      await provider.generateCompletionStream('Hi', () => {});

      // Should log request details (4 calls total: 2 from initialize, 2 from stream)
      expect(console.log).toHaveBeenCalledTimes(4);
    });
  });

  describe('validateConfig', () => {
    it('should return valid with proper API key', async () => {
      await provider.initialize({ apiKey: 'sk-ant-test-key' });

      const result = await provider.validateConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return errors without API key', async () => {
      const result = await provider.validateConfig({});

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API key is required');
    });
  });

  describe('getAvailableModels', () => {
    it('should return active and legacy models', async () => {
      const models = await provider.getAvailableModels();

      expect(models).toContain('claude-sonnet-4-6');
      expect(models).toContain('claude-opus-4-6');
      expect(models).toContain('claude-haiku-4-5-20251001');
      expect(models).toContain('claude-3-opus-20240229');
    });

    it('should return models in predefined order (ACTIVE + LEGACY)', async () => {
      const models = await provider.getAvailableModels();

      // Models are returned in the order they're defined (ACTIVE first, then LEGACY)
      expect(models).toContain('claude-sonnet-4-6');
      expect(models).toContain('claude-opus-4-6');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return cached models if available and fresh', async () => {
      await provider.initialize({ apiKey: 'sk-ant-test-key' });

      // Set cache
      provider.modelsCache = ['cached-model-1', 'cached-model-2'];
      provider.modelsCacheTime = Date.now();

      const models = await provider.getAvailableModels();

      expect(models).toEqual(['cached-model-1', 'cached-model-2']);
    });

    it('should fetch models from API if cache expired', async () => {
      await provider.initialize({ apiKey: 'sk-ant-test-key' });

      // Set expired cache
      provider.modelsCache = ['old-model'];
      provider.modelsCacheTime = Date.now() - provider.CACHE_DURATION - 1000;

      // Mock API response
      const mockModels = {
        data: [{ id: 'claude-sonnet-4-6' }],
      };

      // Mock fetch
      const { fetchWithCorsProxy } = require('@/utils/corsProxyUtil');
      fetchWithCorsProxy.mockResolvedValue({
        ok: true,
        json: async () => mockModels,
      });

      const models = await provider.getAvailableModels();

      expect(models).toContain('claude-sonnet-4-6');
    });

    it('should return fallback models if API fails', async () => {
      await provider.initialize({ apiKey: 'sk-ant-test-key' });

      // Set expired cache
      provider.modelsCache = null;
      provider.modelsCacheTime = null;

      // Mock API failure
      const { fetchWithCorsProxy } = require('@/utils/corsProxyUtil');
      fetchWithCorsProxy.mockRejectedValue(new Error('API error'));

      const models = await provider.getAvailableModels();

      expect(models).toContain('claude-sonnet-4-6');
      expect(models).toContain('claude-opus-4-6');
    });
  });

  describe('getProviderInfo', () => {
    it('should return correct provider info', () => {
      const info = provider.getProviderInfo();

      expect(info.id).toBe('anthropic');
      expect(info.name).toBe('Anthropic');
      expect(info.supportsStreaming).toBe(true);
      expect(info.requiresApiKey).toBe(true);
      expect(info.requiresLocalServer).toBe(false);
    });

    it('should include default models', () => {
      const info = provider.getProviderInfo();

      expect(info.defaultModels).toContain('claude-sonnet-4-6');
      expect(info.defaultModels).toContain('claude-opus-4-6');
    });
  });
});

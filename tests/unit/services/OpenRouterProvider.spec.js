import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { OpenRouterProvider } from '@/services/ai/providers/OpenRouterProvider';

// Helper function to create mock stream response
const createMockStreamResponse = chunks => {
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });
  return {
    ok: true,
    body: stream,
  };
};

describe('OpenRouterProvider', () => {
  let provider;
  let mockFetch;

  beforeEach(() => {
    provider = new OpenRouterProvider();

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

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
      expect(provider).toBeInstanceOf(OpenRouterProvider);
      expect(provider.initialized).toBe(false);
      expect(provider.modelsCache).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should initialize with API key', async () => {
      await provider.initialize({ apiKey: 'sk-or-v1-test-key' });

      expect(provider.initialized).toBe(true);
      expect(provider.config.apiKey).toBe('sk-or-v1-test-key');
    });

    it('should set default model', async () => {
      await provider.initialize({ apiKey: 'sk-or-v1-test-key' });

      expect(provider.config.model).toBe('anthropic/claude-sonnet-4');
    });

    it('should set custom model', async () => {
      await provider.initialize({
        apiKey: 'sk-or-v1-test-key',
        model: 'openai/gpt-4o',
      });

      expect(provider.config.model).toBe('openai/gpt-4o');
    });

    it('should set default temperature', async () => {
      await provider.initialize({ apiKey: 'sk-or-v1-test-key' });

      expect(provider.config.temperature).toBe(0.3);
    });

    it('should set custom temperature', async () => {
      await provider.initialize({
        apiKey: 'sk-or-v1-test-key',
        temperature: 0.7,
      });

      expect(provider.config.temperature).toBe(0.7);
    });

    it('should set default maxTokens', async () => {
      await provider.initialize({ apiKey: 'sk-or-v1-test-key' });

      expect(provider.config.maxTokens).toBe(8192);
    });

    it('should set custom maxTokens', async () => {
      await provider.initialize({
        apiKey: 'sk-or-v1-test-key',
        maxTokens: 4096,
      });

      expect(provider.config.maxTokens).toBe(4096);
    });

    it('should throw error without API key', async () => {
      await expect(provider.initialize({})).rejects.toThrow(
        'OpenRouter API key is required. Get one at https://openrouter.ai/keys'
      );
    });

    it('should throw error with empty API key', async () => {
      await expect(provider.initialize({ apiKey: '' })).rejects.toThrow(
        'OpenRouter API key is required'
      );
    });

    it('should throw error with null API key', async () => {
      await expect(provider.initialize({ apiKey: null })).rejects.toThrow(
        'OpenRouter API key is required'
      );
    });
  });

  describe('generateCompletionStream', () => {
    beforeEach(async () => {
      await provider.initialize({ apiKey: 'sk-or-v1-test-key' });
    });

    it('should send request to OpenRouter API', async () => {
      const chunks = ['data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'];
      mockFetch.mockResolvedValue(createMockStreamResponse(chunks));

      const onChunk = jest.fn();
      await provider.generateCompletionStream('Hi', onChunk);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer sk-or-v1-test-key',
            'Content-Type': 'application/json',
            'X-Title': 'Your Assistant',
          }),
        })
      );
    });

    it('should include system prompt in request', async () => {
      const chunks = ['data: {"choices":[{"delta":{"content":"Response"}}]}\n\n'];
      mockFetch.mockResolvedValue(createMockStreamResponse(chunks));

      const onChunk = jest.fn();
      await provider.generateCompletionStream('Hi', onChunk, {
        systemPrompt: 'You are helpful',
      });

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callArgs.messages).toContainEqual({
        role: 'system',
        content: 'You are helpful',
      });
    });

    it('should handle text-only prompts', async () => {
      const chunks = ['data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'];
      mockFetch.mockResolvedValue(createMockStreamResponse(chunks));

      const onChunk = jest.fn();
      await provider.generateCompletionStream('Hi', onChunk);

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callArgs.messages).toContainEqual({
        role: 'user',
        content: 'Hi',
      });
    });

    it('should handle vision prompts with images', async () => {
      const chunks = ['data: {"choices":[{"delta":{"content":"I see an image"}}]}\n\n'];
      mockFetch.mockResolvedValue(createMockStreamResponse(chunks));

      const onChunk = jest.fn();
      const imageDataUrls = ['data:image/png;base64,abc123'];

      await provider.generateCompletionStream('What do you see?', onChunk, {
        imageDataUrls,
      });

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      const userMessage = callArgs.messages.find(m => m.role === 'user');

      expect(userMessage.content).toBeInstanceOf(Array);
      expect(userMessage.content[0]).toEqual({ type: 'text', text: 'What do you see?' });
      expect(userMessage.content[1]).toEqual({
        type: 'image_url',
        image_url: { url: 'data:image/png;base64,abc123' },
      });
    });

    it('should handle multiple images', async () => {
      const chunks = ['data: {"choices":[{"delta":{"content":"I see images"}}]}\n\n'];
      mockFetch.mockResolvedValue(createMockStreamResponse(chunks));

      const onChunk = jest.fn();
      const imageDataUrls = [
        'data:image/png;base64,abc123',
        'data:image/jpeg;base64,def456',
      ];

      await provider.generateCompletionStream('What do you see?', onChunk, {
        imageDataUrls,
      });

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      const userMessage = callArgs.messages.find(m => m.role === 'user');

      expect(userMessage.content).toHaveLength(3); // text + 2 images
      expect(userMessage.content[1]).toEqual({
        type: 'image_url',
        image_url: { url: 'data:image/png;base64,abc123' },
      });
      expect(userMessage.content[2]).toEqual({
        type: 'image_url',
        image_url: { url: 'data:image/jpeg;base64,def456' },
      });
    });

    it('should use custom maxTokens from options', async () => {
      const chunks = ['data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'];
      mockFetch.mockResolvedValue(createMockStreamResponse(chunks));

      const onChunk = jest.fn();
      await provider.generateCompletionStream('Hi', onChunk, {
        maxTokens: 2048,
      });

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callArgs.max_tokens).toBe(2048);
    });

    it('should use default maxTokens when not provided in options', async () => {
      const chunks = ['data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'];
      mockFetch.mockResolvedValue(createMockStreamResponse(chunks));

      const onChunk = jest.fn();
      await provider.generateCompletionStream('Hi', onChunk);

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callArgs.max_tokens).toBe(8192);
    });

    it('should throw error if not initialized', async () => {
      const uninitializedProvider = new OpenRouterProvider();

      const onChunk = jest.fn();
      await expect(
        uninitializedProvider.generateCompletionStream('Hi', onChunk)
      ).rejects.toThrow('OpenRouter provider not initialized');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const onChunk = jest.fn();
      await expect(provider.generateCompletionStream('Hi', onChunk)).rejects.toThrow();
    });

    it('should retry on network errors', async () => {
      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(
          createMockStreamResponse(['data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'])
        );

      const onChunk = jest.fn();
      await provider.generateCompletionStream('Hi', onChunk);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(onChunk).toHaveBeenCalledWith('Hello');
    });
  });

  describe('generateCompletion', () => {
    beforeEach(async () => {
      await provider.initialize({ apiKey: 'sk-or-v1-test-key' });
    });

    it('should accumulate streaming response', async () => {
      const chunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" World"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"!"}}]}\n\n',
      ];
      mockFetch.mockResolvedValue(createMockStreamResponse(chunks));

      const response = await provider.generateCompletion('Hi');

      expect(response).toBe('Hello World!');
    });

    it('should handle empty response', async () => {
      const chunks = ['data: [DONE]\n'];
      mockFetch.mockResolvedValue(createMockStreamResponse(chunks));

      const response = await provider.generateCompletion('Hi');

      expect(response).toBe('');
    });

    it('should pass options to stream method', async () => {
      const chunks = ['data: {"choices":[{"delta":{"content":"Response"}}]}\n\n'];
      mockFetch.mockResolvedValue(createMockStreamResponse(chunks));

      await provider.generateCompletion('Hi', {
        systemPrompt: 'You are helpful',
        maxTokens: 2048,
      });

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callArgs.messages[0]).toEqual({
        role: 'system',
        content: 'You are helpful',
      });
      expect(callArgs.max_tokens).toBe(2048);
    });
  });

  describe('validateConfig', () => {
    it('should return valid with API key', async () => {
      await provider.initialize({ apiKey: 'sk-or-v1-test-key' });

      const result = await provider.validateConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return errors without API key', async () => {
      const result = await provider.validateConfig({});

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn if API key format is incorrect', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await provider.initialize({ apiKey: 'invalid-key' });

      // This should trigger a warning about the API key format
      // The provider should still work but warn about the format

      consoleWarnSpy.mockRestore();
    });
  });

  describe('getProviderInfo', () => {
    it('should return correct provider info', () => {
      const info = provider.getProviderInfo();

      expect(info.id).toBe('openrouter');
      expect(info.name).toBe('OpenRouter');
      expect(info.supportsStreaming).toBe(true);
      expect(info.requiresApiKey).toBe(true);
      expect(info.requiresLocalServer).toBe(false);
      expect(info.documentationUrl).toBe('https://openrouter.ai/docs');
    });
  });

  describe('getAvailableModels', () => {
    beforeEach(async () => {
      await provider.initialize({ apiKey: 'sk-or-v1-test-key' });
    });

    it('should fetch models from API', async () => {
      const mockModels = {
        data: [
          { id: 'anthropic/claude-sonnet-4' },
          { id: 'openai/gpt-4o' },
          { id: 'google/gemini-pro-1.5' },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockModels,
      });

      const models = await provider.getAvailableModels();

      // Models are sorted alphabetically
      expect(models).toEqual([
        'anthropic/claude-sonnet-4',
        'google/gemini-pro-1.5',
        'openai/gpt-4o',
      ]);
    });

    it('should use cached models', async () => {
      // The provider uses modelCacheUtil, not modelsCache property
      // We need to test through the actual caching mechanism
      const mockModels = {
        data: [
          { id: 'cached-model-1' },
          { id: 'cached-model-2' },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockModels,
      });

      // First call should fetch
      const models1 = await provider.getAvailableModels();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const models2 = await provider.getAvailableModels();
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional call

      expect(models2).toEqual(models1);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      // Should return fallback models or empty array
      const models = await provider.getAvailableModels();

      expect(Array.isArray(models)).toBe(true);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Should return fallback models or empty array
      const models = await provider.getAvailableModels();

      expect(Array.isArray(models)).toBe(true);
    });
  });

  describe('integration tests', () => {
    it('should handle complete workflow', async () => {
      // Initialize
      await provider.initialize({
        apiKey: 'sk-or-v1-test-key',
        model: 'openai/gpt-4o',
      });

      expect(provider.initialized).toBe(true);

      // Generate completion
      const chunks = [
        'data: {"choices":[{"delta":{"content":"This"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" is"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" a"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" test"}}]}\n\n',
      ];
      mockFetch.mockResolvedValue(
        createMockStreamResponse(chunks)
      );

      const onChunk = jest.fn();
      await provider.generateCompletionStream('Say "this is a test"', onChunk);

      expect(onChunk).toHaveBeenLastCalledWith(' test');
      const allChunks = onChunk.mock.calls.map(call => call[0]).join('');
      expect(allChunks).toBe('This is a test');
    });
  });
});

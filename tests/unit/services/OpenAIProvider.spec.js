import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { OpenAIProvider } from '@/services/ai/providers/OpenAIProvider';

// Mock OpenAI SDK
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
      models: {
        list: jest.fn(),
      },
    })),
  };
});

describe('OpenAIProvider', () => {
  let provider;
  let mockOpenAI;

  beforeEach(() => {
    provider = new OpenAIProvider();

    // Get the mocked OpenAI constructor
    mockOpenAI = require('openai').default;

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
      expect(provider).toBeInstanceOf(OpenAIProvider);
      expect(provider.initialized).toBe(false);
      expect(provider.client).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should initialize with API key', async () => {
      await provider.initialize({ apiKey: 'sk-test-key' });

      expect(provider.initialized).toBe(true);
      expect(provider.config.apiKey).toBe('sk-test-key');
      expect(mockOpenAI).toHaveBeenCalledWith({
        apiKey: 'sk-test-key',
        dangerouslyAllowBrowser: true,
      });
    });

    it('should set default model', async () => {
      await provider.initialize({ apiKey: 'sk-test-key' });

      expect(provider.config.model).toBe('gpt-3.5-turbo');
    });

    it('should set custom model', async () => {
      await provider.initialize({ apiKey: 'sk-test-key', model: 'gpt-4' });

      expect(provider.config.model).toBe('gpt-4');
    });

    it('should set default temperature', async () => {
      await provider.initialize({ apiKey: 'sk-test-key' });

      expect(provider.config.temperature).toBe(0.3);
    });

    it('should set custom temperature', async () => {
      await provider.initialize({ apiKey: 'sk-test-key', temperature: 0.7 });

      expect(provider.config.temperature).toBe(0.7);
    });

    it('should handle temperature of 0', async () => {
      await provider.initialize({ apiKey: 'sk-test-key', temperature: 0 });

      expect(provider.config.temperature).toBe(0);
    });

    it('should throw error without API key', async () => {
      await expect(provider.initialize({})).rejects.toThrow('OpenAI API key is required');
    });

    it('should throw error with empty API key', async () => {
      await expect(provider.initialize({ apiKey: '' })).rejects.toThrow(
        'OpenAI API key is required'
      );
    });

    it('should throw error with null API key', async () => {
      await expect(provider.initialize({ apiKey: null })).rejects.toThrow(
        'OpenAI API key is required'
      );
    });
  });

  describe('generateCompletion', () => {
    beforeEach(async () => {
      await provider.initialize({ apiKey: 'sk-test-key' });
    });

    it('should generate text-only completion', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
      };

      provider.client.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await provider.generateCompletion('Hello');

      expect(result).toBe('Test response');
      expect(provider.client.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.3,
      });
    });

    it('should handle system prompt', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response with system prompt' } }],
      };

      provider.client.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await provider.generateCompletion('Hello', {
        systemPrompt: 'You are helpful',
      });

      expect(result).toBe('Response with system prompt');
      expect(provider.client.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are helpful' },
          { role: 'user', content: 'Hello' },
        ],
        temperature: 0.3,
      });
    });

    it('should handle vision prompts with images', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'I see an image' } }],
      };

      provider.client.chat.completions.create.mockResolvedValue(mockResponse);

      const imageDataUrls = ['data:image/png;base64,abc123'];
      const result = await provider.generateCompletion('What do you see?', {
        imageDataUrls,
      });

      expect(result).toBe('I see an image');
      const callArgs = provider.client.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages[0].role).toBe('user');
      expect(callArgs.messages[0].content).toHaveLength(2);
      expect(callArgs.messages[0].content[0]).toEqual({ type: 'text', text: 'What do you see?' });
      expect(callArgs.messages[0].content[1]).toEqual({
        type: 'image_url',
        image_url: { url: 'data:image/png;base64,abc123' },
      });
    });

    it('should handle multiple images', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'I see multiple images' } }],
      };

      provider.client.chat.completions.create.mockResolvedValue(mockResponse);

      const imageDataUrls = ['data:image/png;base64,abc123', 'data:image/jpeg;base64,def456'];

      await provider.generateCompletion('What do you see?', { imageDataUrls });

      const callArgs = provider.client.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages[0].content).toHaveLength(3); // text + 2 images
    });

    it('should use max_completion_tokens if provided', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
      };

      provider.client.chat.completions.create.mockResolvedValue(mockResponse);

      await provider.generateCompletion('Hello', { max_completion_tokens: 1000 });

      expect(provider.client.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.3,
        max_completion_tokens: 1000,
      });
    });

    it('should use max_tokens as fallback', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
      };

      provider.client.chat.completions.create.mockResolvedValue(mockResponse);

      await provider.generateCompletion('Hello', { max_tokens: 1000 });

      expect(provider.client.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.3,
        max_completion_tokens: 1000,
      });
    });

    it('should throw error if not initialized', async () => {
      const uninitializedProvider = new OpenAIProvider();

      await expect(uninitializedProvider.generateCompletion('Hello')).rejects.toThrow(
        'OpenAI provider not initialized'
      );
    });

    it('should return empty string if no content in response', async () => {
      const mockResponse = { choices: [{}] };

      provider.client.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await provider.generateCompletion('Hello');

      expect(result).toBe('');
    });
  });

  describe('generateCompletionStream', () => {
    beforeEach(async () => {
      await provider.initialize({ apiKey: 'sk-test-key' });
    });

    it('should stream text-only response', async () => {
      const mockStream = [
        { choices: [{ delta: { content: 'Hello' } }] },
        { choices: [{ delta: { content: ' World' } }] },
        { choices: [{ delta: { content: '!' } }] },
      ];

      const mockAsyncIterator = {
        async *[Symbol.asyncIterator]() {
          for (const chunk of mockStream) {
            yield chunk;
          }
        },
      };

      provider.client.chat.completions.create.mockResolvedValue(mockAsyncIterator);

      const chunks = [];
      const onChunk = chunk => chunks.push(chunk);

      await provider.generateCompletionStream('Hi', onChunk);

      expect(chunks).toEqual(['Hello', ' World', '!']);
    });

    it('should handle system prompt in stream', async () => {
      const mockStream = [{ choices: [{ delta: { content: 'Response' } }] }];

      const mockAsyncIterator = {
        async *[Symbol.asyncIterator]() {
          yield mockStream[0];
        },
      };

      provider.client.chat.completions.create.mockResolvedValue(mockAsyncIterator);

      const chunks = [];
      await provider.generateCompletionStream('Hi', chunk => chunks.push(chunk), {
        systemPrompt: 'You are helpful',
      });

      const callArgs = provider.client.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages[0]).toEqual({
        role: 'system',
        content: 'You are helpful',
      });
    });

    it('should handle vision prompts in stream', async () => {
      const mockStream = [{ choices: [{ delta: { content: 'I see images' } }] }];

      const mockAsyncIterator = {
        async *[Symbol.asyncIterator]() {
          yield mockStream[0];
        },
      };

      provider.client.chat.completions.create.mockResolvedValue(mockAsyncIterator);

      const imageDataUrls = ['data:image/png;base64,abc123'];

      await provider.generateCompletionStream('What do you see?', () => {}, {
        imageDataUrls,
      });

      const callArgs = provider.client.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages[0].content).toHaveLength(2);
      expect(callArgs.messages[0].content[1]).toEqual({
        type: 'image_url',
        image_url: { url: 'data:image/png;base64,abc123' },
      });
    });

    it('should use retry logic for streaming', async () => {
      const mockStream = [{ choices: [{ delta: { content: 'Success' } }] }];

      const mockAsyncIterator = {
        async *[Symbol.asyncIterator]() {
          yield mockStream[0];
        },
      };

      provider.client.chat.completions.create.mockResolvedValue(mockAsyncIterator);

      const executeWithRetrySpy = jest.spyOn(provider, 'executeWithRetry');

      await provider.generateCompletionStream('Hi', () => {});

      expect(executeWithRetrySpy).toHaveBeenCalled();
    });

    it('should handle streaming errors', async () => {
      const mockError = new Error('Stream failed');
      provider.client.chat.completions.create.mockRejectedValue(mockError);

      // The error is caught and re-thrown with different message
      await expect(provider.generateCompletionStream('Hi', () => {})).rejects.toThrow(
        'Stream failed'
      );
    });

    it('should throw error if not initialized', async () => {
      const uninitializedProvider = new OpenAIProvider();

      await expect(uninitializedProvider.generateCompletionStream('Hi', () => {})).rejects.toThrow(
        'OpenAI provider not initialized'
      );
    });

    it('should skip empty chunks', async () => {
      const mockStream = [
        { choices: [{}] }, // No delta
        { choices: [{ delta: {} }] }, // No content
        { choices: [{ delta: { content: 'Hello' } }] },
      ];

      const mockAsyncIterator = {
        async *[Symbol.asyncIterator]() {
          for (const chunk of mockStream) {
            yield chunk;
          }
        },
      };

      provider.client.chat.completions.create.mockResolvedValue(mockAsyncIterator);

      const chunks = [];
      await provider.generateCompletionStream('Hi', chunk => chunks.push(chunk));

      expect(chunks).toEqual(['Hello']);
    });
  });

  describe('validateConfig', () => {
    it('should return valid with proper API key', async () => {
      await provider.initialize({ apiKey: 'sk-test-key' });

      const result = await provider.validateConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return errors without API key', async () => {
      const result = await provider.validateConfig({});

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API key is required');
    });

    it('should warn about API key format', async () => {
      await provider.initialize({ apiKey: 'invalid-key' });

      const result = await provider.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API key should start with "sk-"');
    });
  });

  describe('getAvailableModels', () => {
    it('should fetch models from API', async () => {
      await provider.initialize({ apiKey: 'sk-test-key' });

      const mockModels = {
        data: [{ id: 'gpt-4' }, { id: 'gpt-3.5-turbo' }, { id: 'gpt-4o' }],
      };

      provider.client.models.list.mockResolvedValue(mockModels);

      const models = await provider.getAvailableModels();

      expect(models).toEqual(['gpt-3.5-turbo', 'gpt-4', 'gpt-4o']); // Sorted alphabetically
    });

    it('should return fallback models if API fails', async () => {
      await provider.initialize({ apiKey: 'sk-test-key' });

      provider.client.models.list.mockRejectedValue(new Error('API error'));

      const models = await provider.getAvailableModels();

      expect(models).toContain('gpt-3.5-turbo');
      expect(models).toContain('gpt-4');
      expect(models).toContain('gpt-4-turbo-preview');
    });

    it('should return fallback models if no GPT models found', async () => {
      await provider.initialize({ apiKey: 'sk-test-key' });

      const mockModels = {
        data: [{ id: 'tts-1' }, { id: 'whisper-1' }],
      };

      provider.client.models.list.mockResolvedValue(mockModels);

      const models = await provider.getAvailableModels();

      expect(models).toContain('gpt-3.5-turbo');
      expect(models).toContain('gpt-4');
    });

    it('should create client if not initialized', async () => {
      provider.config = { apiKey: 'sk-test-key' };

      // Clear the client to simulate uninitialized state
      provider.client = null;

      // Create a mock implementation that will be called when list() is invoked
      const mockListFunction = jest.fn().mockResolvedValue({
        data: [{ id: 'gpt-4' }],
      });

      // Make the OpenAI constructor return an object with the mocked list function
      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn(),
          },
        },
        models: {
          list: mockListFunction,
        },
      }));

      await provider.getAvailableModels();

      expect(provider.client).toBeDefined();
      expect(mockListFunction).toHaveBeenCalled();
    });
  });

  describe('getProviderInfo', () => {
    it('should return correct provider info', () => {
      const info = provider.getProviderInfo();

      expect(info.id).toBe('openai');
      expect(info.name).toBe('OpenAI');
      expect(info.supportsStreaming).toBe(true);
      expect(info.requiresApiKey).toBe(true);
      expect(info.requiresLocalServer).toBe(false);
      expect(info.description).toBe('GPT-3.5, GPT-4, and other OpenAI models');
      expect(info.defaultModels).toEqual(['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview']);
    });

    it('should include config fields', () => {
      const info = provider.getProviderInfo();

      expect(info.configFields).toHaveLength(3);
      expect(info.configFields[0]).toEqual({
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
      });
    });
  });
});

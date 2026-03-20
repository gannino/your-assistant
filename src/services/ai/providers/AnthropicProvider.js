/**
 * AnthropicProvider - Anthropic Claude models provider
 *
 * Supports Claude 3 models (Haiku, Sonnet, Opus).
 * Uses Anthropic's official TypeScript SDK for API communication.
 */

import { BaseAIProvider } from './BaseAIProvider';
import Anthropic from '@anthropic-ai/sdk';

// Model definitions for consistency
const ACTIVE_MODELS = [
  'claude-sonnet-4-6',
  'claude-opus-4-6',
  'claude-haiku-4-5-20251001',
  'claude-opus-4-5-20251101',
  'claude-opus-4-1-20250805',
  'claude-opus-4-20250514',
  'claude-sonnet-4-5-20250929',
  'claude-sonnet-4-20250514',
];

const LEGACY_MODELS = [
  'claude-3-haiku-20240307',
  'claude-3-sonnet-20240229',
  'claude-3-opus-20240229',
];

const ALL_MODELS = [...ACTIVE_MODELS, ...LEGACY_MODELS];

export class AnthropicProvider extends BaseAIProvider {
  constructor() {
    super({});
    /** @type {Anthropic | null} */
    this.client = null;
    /** @type {Object} */
    this.config = {};
    /** @type {boolean} */
    this.debug = false;
    /** @type {Array<string> | null} */
    this.modelsCache = null;
    /** @type {number | null} */
    this.modelsCacheTime = null;
    /** @type {number} */
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize the Anthropic provider with API configuration
   * @param {Object} config - Configuration object
   * @param {string} config.apiKey - Anthropic API key
   * @param {string} config.model - Model name (default: claude-sonnet-4-6)
   */
  async initialize(config) {
    console.log('[Anthropic] initialize called with config:', {
      hasApiKey: !!config.apiKey,
      apiKeyLength: config.apiKey?.length || 0,
      apiKeyPrefix: config.apiKey?.substring(0, 10) || 'none',
      model: config.model,
    });

    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'claude-sonnet-4-6', // Use valid Anthropic model ID
      maxTokens: 8192,
      temperature: config.temperature ?? 0.3,
      ...config,
    };

    console.log('[Anthropic] Config set:', {
      hasApiKey: !!this.config.apiKey,
      apiKeyLength: this.config.apiKey?.length || 0,
      apiKeyPrefix: this.config.apiKey?.substring(0, 10) || 'none',
    });

    // Warn if using deprecated/retired models
    if (LEGACY_MODELS.includes(this.config.model)) {
      console.warn(
        `[Anthropic] Model ${this.config.model} is deprecated or retired; calls may fail after deprecation dates.`
      );
    }

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      dangerouslyAllowBrowser: true,
    });

    this.initialized = true;
    this.debug = config.debug ?? false;
  }

  /**
   * Generate a non-streaming completion
   * @param {string} prompt - The input prompt
   * @param {Object} options - Additional options
   * @param {string[]} options.imageDataUrls - Array of base64 image data URLs (vision support)
   * @param {string} options.systemPrompt - System prompt to override default
   * @returns {Promise<string>} The generated completion
   */
  async generateCompletion(prompt, options = {}) {
    if (!this.client) {
      throw new Error('Anthropic provider not initialized. Call initialize() first.');
    }

    const { systemPrompt, imageDataUrls, maxTokens, ...restOptions } = options;

    // Build content array with vision support
    let userContent;
    if (imageDataUrls && imageDataUrls.length > 0) {
      // Multimodal request with images
      userContent = [
        { type: 'text', text: prompt },
        ...imageDataUrls.map(dataUrl => {
          const [header, data] = dataUrl.split(',');
          const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
          return {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: data,
            },
          };
        }),
      ];
    } else {
      // Text-only request
      userContent = prompt;
    }

    const response = await this.executeWithRetry(
      async () => {
        const request = {
          model: this.config.model,
          max_tokens: maxTokens || this.config.maxTokens,
          temperature: this.config.temperature,
          messages: [{ role: 'user', content: userContent }],
        };

        // Add system prompt if provided
        if (systemPrompt) {
          request.system = systemPrompt;
        }

        // Add any additional options
        Object.assign(request, restOptions);

        return await this.client.messages.create(request);
      },
      {
        onRetry: (attempt, error) => {
          console.warn(
            `[Anthropic] Retrying completion generation (attempt ${attempt}): ${error.message}`
          );
        },
      }
    );

    // Extract text from all content blocks, not just the first one
    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');
    return text;
  }

  /**
   * Generate a streaming completion
   * @param {string} prompt - The input prompt
   * @param {Function} onChunk - Callback function for each chunk
   * @param {Object} options - Additional options
   * @param {string[]} options.imageDataUrls - Array of base64 image data URLs (vision support)
   * @param {string} options.systemPrompt - System prompt to override default
   * @returns {Promise<void>}
   */
  async generateCompletionStream(prompt, onChunk, options = {}) {
    if (!this.client) {
      throw new Error('Anthropic provider not initialized. Call initialize() first.');
    }

    const { systemPrompt, imageDataUrls, maxTokens, ...restOptions } = options;

    // Build content array with vision support
    let userContent;
    if (imageDataUrls && imageDataUrls.length > 0) {
      // Multimodal request with images
      userContent = [
        { type: 'text', text: prompt },
        ...imageDataUrls.map(dataUrl => {
          const [header, data] = dataUrl.split(',');
          const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
          return {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: data,
            },
          };
        }),
      ];
    } else {
      // Text-only request
      userContent = prompt;
    }

    try {
      // Use retry logic for the initial request
      const stream = await this.executeWithRetry(
        async () => {
          const request = {
            model: this.config.model,
            max_tokens: maxTokens || this.config.maxTokens,
            temperature: this.config.temperature,
            messages: [{ role: 'user', content: userContent }],
          };

          // Add system prompt if provided
          if (systemPrompt) {
            request.system = systemPrompt;
          }

          // Add any additional options
          Object.assign(request, restOptions);

          // Debug: Log the actual request being sent
          if (this.debug) {
            console.log('[Anthropic] Sending request:', JSON.stringify(request, null, 2));
            console.log(`[Anthropic] Request content length: ${prompt.length} chars`);
          }

          return await this.client.messages.stream(request);
        },
        {
          onRetry: (attempt, error) => {
            console.warn(
              `[Anthropic] Retrying stream generation (attempt ${attempt}): ${error.message}`
            );
          },
        }
      );

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const delta = event.delta;
          if (delta?.type === 'text_delta' && delta.text) {
            onChunk(delta.text);
          }
        }
      }
    } catch (error) {
      console.error('[Anthropic] Streaming error details:', {
        message: error.message,
        stack: error.stack,
        errorType: error.constructor.name,
        statusCode: error.status,
        response: error.response,
      });
      throw new Error(`Anthropic streaming failed: ${error.message}`);
    }
  }

  /**
   * Validate the Anthropic configuration
   * @returns {Promise<Object>} Validation result
   */
  async validateConfig({ test = false } = {}) {
    const errors = [];

    if (!this.config.apiKey) {
      errors.push('API key is required');
    }

    // Warn instead of error for API key prefix - Anthropic may change prefixes
    if (this.config.apiKey && !this.config.apiKey.startsWith('sk-ant-')) {
      console.warn(
        '[Anthropic] Warning: API key does not start with "sk-ant-". This may be a valid key with a different prefix.'
      );
    }

    // Only test the API key if explicitly requested and we have a client
    if (test && this.config.apiKey && this.client) {
      try {
        if (this.debug) {
          console.log('[Anthropic] Testing API key with simple request...');
        }
        await this.client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 10,
          temperature: 0,
          messages: [{ role: 'user', content: 'Hello' }],
        });
        if (this.debug) {
          console.log('[Anthropic] API key validation successful');
        }
      } catch (error) {
        console.error('[Anthropic] API key validation failed:', error.message);
        errors.push(`API key validation failed: ${error.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get available Anthropic models
   * @returns {Promise<Array<string>>} Array of model names
   *
   * Fetches models from Anthropic's API using the SDK's models.list() method.
   */
  async getAvailableModels() {
    // Check cache first
    if (this.modelsCache && this.modelsCacheTime) {
      const cacheAge = Date.now() - this.modelsCacheTime;
      if (cacheAge < this.CACHE_DURATION) {
        console.log(`[Anthropic] Using cached models (${Math.round(cacheAge / 1000)}s old)`);
        return this.modelsCache;
      }
      // Cache expired
      console.log('[Anthropic] Cache expired, refetching models...');
      this.modelsCache = null;
      this.modelsCacheTime = null;
    }

    if (!this.client) {
      console.log('[Anthropic] SDK not initialized, using hardcoded model list');
      return ALL_MODELS;
    }

    // Fetch from Anthropic API using SDK's models.list() method
    try {
      console.log('[Anthropic] Fetching models from API via SDK...');

      const models = [];
      for await (const modelInfo of this.client.models.list()) {
        if (modelInfo.id && modelInfo.id.startsWith('claude-')) {
          models.push(modelInfo.id);
        }
      }

      if (models.length > 0) {
        console.log(`[Anthropic] ✅ Fetched ${models.length} models from API`);

        // Cache the results
        this.modelsCache = models.sort();
        this.modelsCacheTime = Date.now();

        return this.modelsCache;
      }

      console.warn('[Anthropic] ⚠️ No models found in API response');
      return this.modelsCache || ALL_MODELS;
    } catch (error) {
      console.error('[Anthropic] ❌ Fetch failed:', error.message);
      console.error('[Anthropic] 💡 Falling back to hardcoded model list');
      return this.modelsCache || ALL_MODELS;
    }
  }

  /**
   * Test the Anthropic API key with a simple request
   * @returns {Promise<Object>} Test result
   */
  async testApiKey() {
    if (!this.client) {
      throw new Error('Anthropic provider not initialized. Call initialize() first.');
    }

    try {
      if (this.debug) {
        console.log('[Anthropic] Testing API key with simple request...');
      }
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 10,
        temperature: 0,
        messages: [{ role: 'user', content: 'Hello' }],
      });
      if (this.debug) {
        console.log('[Anthropic] API key validation successful');
      }
      // Extract text from all content blocks, not just the first one
      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('');

      return {
        success: true,
        message: 'API key is valid and working',
        model: response.model,
        content: content,
      };
    } catch (error) {
      console.error('[Anthropic] API key test failed:', error.message);
      return {
        success: false,
        message: `API key validation failed: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Get provider metadata
   * @returns {Object} Provider information
   */
  getProviderInfo() {
    return {
      id: 'anthropic',
      name: 'Anthropic',
      description:
        'Claude 4.6 Sonnet, 4.5, and 3.7 models with official SDK support and vision capabilities',
      supportsStreaming: true,
      supportsVision: true,
      requiresApiKey: true,
      requiresLocalServer: false,
      sdkPackage: '@anthropic-ai/sdk',
      documentationUrl: 'https://docs.anthropic.com/en/docs/about-claude/models',
      modelsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models',
      defaultModels: ACTIVE_MODELS,
      configFields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true },
        {
          name: 'model',
          label: 'Model',
          type: 'select',
          required: false,
          options: ALL_MODELS,
        },
        {
          name: 'temperature',
          label: 'Temperature',
          type: 'number',
          required: false,
          default: 0.3,
          min: 0,
          max: 1,
          step: 0.1,
          description:
            'Controls randomness. 0.3 = focused, 1.0 = creative. Range: 0-1 for Claude models.',
        },
      ],
    };
  }
}

/**
 * OpenAIProvider - OpenAI GPT models provider
 *
 * Supports GPT-3.5, GPT-4, and other OpenAI chat models.
 * Uses the official OpenAI SDK for API communication.
 */

import { BaseAIProvider } from './BaseAIProvider';
import OpenAI from 'openai';

export class OpenAIProvider extends BaseAIProvider {
  constructor() {
    super({});
    /** @type {OpenAI | null} */
    this.client = null;
    /** @type {Array<string> | null} */
    this.modelsCache = null;
    /** @type {number | null} */
    this.modelsCacheTime = null;
    /** @type {number} */
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize the OpenAI client with API key
   * @param {Object} config - Configuration object
   * @param {string} config.apiKey - OpenAI API key
   * @param {string} config.model - Model name (default: gpt-3.5-turbo)
   */
  async initialize(config) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gpt-3.5-turbo',
      temperature: config.temperature ?? 0.3, // Default to 0.3
      ...config,
    };

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      dangerouslyAllowBrowser: true,
    });

    this.initialized = true;
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
      throw new Error('OpenAI provider not initialized. Call initialize() first.');
    }

    const { systemPrompt, imageDataUrls, max_tokens, max_completion_tokens, ...restOptions } =
      options;
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });

    // Build user message with vision support
    if (imageDataUrls && imageDataUrls.length > 0) {
      // Multimodal request with images
      const content = [{ type: 'text', text: prompt }];
      for (const imageUrl of imageDataUrls) {
        content.push({
          type: 'image_url',
          image_url: { url: imageUrl },
        });
      }
      messages.push({ role: 'user', content });
    } else {
      // Text-only request
      messages.push({ role: 'user', content: prompt });
    }

    // Convert max_tokens to max_completion_tokens for newer models
    // Newer models (o1, o3, etc.) require max_completion_tokens instead of max_tokens
    const requestOptions = {
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      ...restOptions,
    };

    // Use max_completion_tokens if provided, otherwise use max_tokens
    if (max_completion_tokens) {
      requestOptions.max_completion_tokens = max_completion_tokens;
    } else if (max_tokens) {
      // For newer models, convert max_tokens to max_completion_tokens
      // For older models, both work but max_completion_tokens is preferred
      requestOptions.max_completion_tokens = max_tokens;
    }

    console.log(
      '[OpenAI] Making API request with options:',
      JSON.stringify(requestOptions, null, 2)
    );
    const response = await this.client.chat.completions.create(requestOptions);
    console.log(
      '[OpenAI] Got response:',
      response.choices[0]?.message?.content?.substring(0, 100) + '...'
    );

    return response.choices[0]?.message?.content || '';
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
      throw new Error('OpenAI provider not initialized. Call initialize() first.');
    }

    const { systemPrompt, imageDataUrls, max_tokens, max_completion_tokens, ...restOptions } =
      options;
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });

    // Build user message with vision support
    if (imageDataUrls && imageDataUrls.length > 0) {
      // Multimodal request with images
      const content = [{ type: 'text', text: prompt }];
      for (const imageUrl of imageDataUrls) {
        content.push({
          type: 'image_url',
          image_url: { url: imageUrl },
        });
      }
      messages.push({ role: 'user', content });
    } else {
      // Text-only request
      messages.push({ role: 'user', content: prompt });
    }

    // Build request options with proper token limit parameter
    const requestOptions = {
      model: this.config.model,
      messages,
      stream: true,
      temperature: this.config.temperature,
      ...restOptions,
    };

    // Use max_completion_tokens if provided, otherwise use max_tokens
    if (max_completion_tokens) {
      requestOptions.max_completion_tokens = max_completion_tokens;
    } else if (max_tokens) {
      // For newer models, convert max_tokens to max_completion_tokens
      requestOptions.max_completion_tokens = max_tokens;
    }

    // Use retry logic for the initial request
    const stream = await this.executeWithRetry(
      async () => {
        return await this.client.chat.completions.create(requestOptions);
      },
      {
        onRetry: (attempt, error) => {
          console.warn(
            `[OpenAI] Retrying stream generation (attempt ${attempt}): ${error.message}`
          );
        },
      }
    );

    try {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          onChunk(text);
        }
      }
    } catch (error) {
      // Handle streaming errors
      console.error('[OpenAI] Streaming error:', error);
      throw new Error(`OpenAI streaming failed: ${error.message}`);
    }
  }

  /**
   * Validate the OpenAI configuration
   * @returns {Promise<Object>} Validation result
   */
  async validateConfig() {
    const errors = [];

    if (!this.config.apiKey) {
      errors.push('API key is required');
    }

    if (this.config.apiKey && !this.config.apiKey.startsWith('sk-')) {
      errors.push('API key should start with "sk-"');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get available OpenAI models
   * @returns {Promise<Array<string>>} Array of model names
   */
  async getAvailableModels() {
    // Check cache first
    if (this.modelsCache && this.modelsCacheTime) {
      const cacheAge = Date.now() - this.modelsCacheTime;
      if (cacheAge < this.CACHE_DURATION) {
        console.log(`[OpenAI] Using cached models (${Math.round(cacheAge / 1000)}s old)`);
        return this.modelsCache;
      }
      // Cache expired
      console.log('[OpenAI] Cache expired, refetching models...');
      this.modelsCache = null;
      this.modelsCacheTime = null;
    }

    if (!this.client) {
      console.log('[OpenAI] SDK not initialized, using hardcoded model list');
      return this.getDefaultModels();
    }

    // Fetch from OpenAI API using SDK
    try {
      console.log('[OpenAI] Fetching models from API via SDK...');

      const modelsList = await this.client.models.list();

      if (modelsList.data && Array.isArray(modelsList.data)) {
        // Filter for chat models and extract IDs
        const chatModels = modelsList.data
          .filter(model => model.id.includes('gpt'))
          .map(model => model.id);

        if (chatModels.length > 0) {
          console.log(`[OpenAI] ✅ Fetched ${chatModels.length} GPT models from API`);

          // Cache the results
          this.modelsCache = chatModels.sort();
          this.modelsCacheTime = Date.now();

          return this.modelsCache;
        }
      }

      console.warn('[OpenAI] ⚠️ No GPT models found in API response');
      return this.modelsCache || this.getDefaultModels();
    } catch (error) {
      // Handle common API errors
      if (error.status === 401) {
        console.error('[OpenAI] ❌ Authentication failed (401)');
        console.error('[OpenAI] 💡 Your API key may be invalid or expired');
      } else if (error.status === 403) {
        console.error('[OpenAI] ❌ Access forbidden (403)');
        console.error('[OpenAI] 💡 Your API key may not have access to this endpoint');
      } else if (error.status === 429) {
        console.warn('[OpenAI] ⚠️ Rate limited by API (429)');
        console.warn('[OpenAI] 💡 Models are cached to avoid rate limits');
      } else {
        console.error('[OpenAI] ❌ Fetch failed:', error.message);
        console.error('[OpenAI] 💡 Falling back to hardcoded model list');
      }

      return this.modelsCache || this.getDefaultModels();
    }
  }

  /**
   * Get default hardcoded model list
   * @returns {Array<string>} Array of model names
   */
  getDefaultModels() {
    return [
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
      'gpt-4',
      'gpt-4-turbo-preview',
      'gpt-4o',
      'gpt-4o-mini',
    ];
  }

  /**
   * Get provider metadata
   * @returns {Object} Provider information
   */
  getProviderInfo() {
    return {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT-3.5, GPT-4, and other OpenAI models',
      supportsStreaming: true,
      requiresApiKey: true,
      requiresLocalServer: false,
      defaultModels: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'],
      configFields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true },
        {
          name: 'model',
          label: 'Model',
          type: 'select',
          required: false,
          options: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview', 'gpt-4o', 'gpt-4o-mini'],
        },
        {
          name: 'temperature',
          label: 'Temperature',
          type: 'number',
          required: false,
          default: 1.0,
          min: 0,
          max: 2,
          step: 0.1,
          description:
            'Controls randomness. 1.0 = default, 0 = focused, 2 = creative. Some models only support 1.0.',
        },
      ],
    };
  }
}

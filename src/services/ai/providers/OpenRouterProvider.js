/**
 * OpenRouterProvider - Access to 300+ LLMs through unified API
 *
 * Supports GPT-4, Claude, Gemini, Llama, Mistral, and more.
 * Uses OpenRouter's API with streaming, vision, and tool calling support.
 * No Vercel AI SDK dependency - direct HTTP integration.
 *
 * @see https://openrouter.ai/docs
 * @see https://openrouter.ai/models
 */

import { BaseAIProvider } from './BaseAIProvider';
import { StreamParser } from '../streaming';
import { getCachedModels, setCachedModels } from '@/utils/modelCacheUtil';
import {
  handleHttpError,
  handleNetworkError,
  logSuccess,
  requireInitialized,
} from '@/utils/apiErrorHandler';
import { withRetry, RetryPresets } from '@/utils/retryUtil';

export class OpenRouterProvider extends BaseAIProvider {
  constructor() {
    super({});
    this.modelsCache = null;
  }

  /**
   * Initialize the OpenRouter provider
   * @param {Object} config - Configuration object
   * @param {string} config.apiKey - OpenRouter API key
   * @param {string} config.model - Model name (default: anthropic/claude-sonnet-4)
   * @param {number} config.temperature - Temperature (default: 0.3)
   */
  async initialize(config) {
    if (!config.apiKey) {
      throw new Error('OpenRouter API key is required. Get one at https://openrouter.ai/keys');
    }

    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'anthropic/claude-sonnet-4',
      temperature: config.temperature ?? 0.3,
      maxTokens: config.maxTokens || 8192,
      ...config,
    };

    this.initialized = true;
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
    requireInitialized(this.initialized, 'OpenRouter');

    const { imageDataUrls, systemPrompt, maxTokens } = options;
    const messages = [];

    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    // Build user message with optional vision support
    if (imageDataUrls && imageDataUrls.length > 0) {
      const content = [{ type: 'text', text: prompt }];

      // Add images
      for (const dataUrl of imageDataUrls) {
        content.push({
          type: 'image_url',
          image_url: { url: dataUrl },
        });
      }

      messages.push({ role: 'user', content });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    try {
      const response = await withRetry(
        async () => {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer':
                typeof window !== 'undefined' ? window.location.href : 'https://your-assistant.app',
              'X-Title': 'Your Assistant',
            },
            body: JSON.stringify({
              model: this.config.model,
              messages,
              stream: true,
              temperature: this.config.temperature,
              max_tokens: maxTokens || this.config.maxTokens,
            }),
          });

          if (!res.ok) {
            const errorText = await res.text();
            const error = new Error(`OpenRouter API error: ${res.status} ${errorText}`);
            error.status = res.status;
            throw error;
          }

          return res;
        },
        { ...RetryPresets.network, context: 'OpenRouter' }
      );

      // Parse OpenRouter SSE stream (OpenAI-compatible format)
      const parser = StreamParser.openAICompatible();
      await parser.parseStream(response.body, onChunk);
    } catch (error) {
      handleNetworkError(error, 'OpenRouter', 'Streaming request');
      throw error;
    }
  }

  /**
   * Generate a non-streaming completion
   * @param {string} prompt - The input prompt
   * @param {Object} options - Additional options
   * @returns {Promise<string>} The generated completion
   */
  async generateCompletion(prompt, options = {}) {
    return new Promise((resolve, reject) => {
      let fullResponse = '';

      this.generateCompletionStream(
        prompt,
        chunk => {
          fullResponse += chunk;
        },
        options
      )
        .then(() => resolve(fullResponse))
        .catch(reject);
    });
  }

  /**
   * Get available models from OpenRouter API
   * @returns {Promise<Array<string>>} Array of model names
   */
  async getAvailableModels() {
    // Check cache first
    const cached = getCachedModels('openrouter');
    if (cached) {
      return cached;
    }

    if (!this.config?.apiKey) {
      console.log('[OpenRouter] No API key, using default model list');
      return this.getDefaultModels();
    }

    try {
      console.log('[OpenRouter] Attempting to fetch models from API...');

      const response = await withRetry(
        async () => {
          const res = await fetch('https://openrouter.ai/api/v1/models', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${this.config.apiKey}`,
            },
          });

          if (!res.ok) {
            const errorText = await res.text();
            const error = new Error(`OpenRouter API error: ${res.status} ${errorText}`);
            error.status = res.status;
            throw error;
          }

          return res;
        },
        { ...RetryPresets.rateLimit, context: 'OpenRouter' }
      );

      if (!response.ok) {
        const fallbackModels = await handleHttpError(response, 'OpenRouter', {
          fallbackModels: this.getDefaultModels(),
          apiKeyUrl: 'https://openrouter.ai/keys',
          docsUrl: 'https://openrouter.ai/docs',
        });
        setCachedModels('openrouter', fallbackModels);
        return fallbackModels;
      }

      const data = await response.json();

      if (data.data && Array.isArray(data.data)) {
        // Extract model IDs
        const models = data.data.map(m => m.id);

        // Sort alphabetically
        models.sort();

        logSuccess('OpenRouter', 'Fetched models', models.length);

        // Cache the results
        setCachedModels('openrouter', models);

        return models;
      }

      // No models found, use fallback
      const defaultModels = this.getDefaultModels();
      console.warn('[OpenRouter] ⚠️ No models found in API response, using default list');
      setCachedModels('openrouter', defaultModels);
      return defaultModels;
    } catch (error) {
      handleNetworkError(error, 'OpenRouter', 'Fetching models');
      const defaultModels = this.getDefaultModels();
      setCachedModels('openrouter', defaultModels);
      return defaultModels;
    }
  }

  /**
   * Get default model list (curated popular models)
   * @returns {Array<string>} Default model names
   */
  getDefaultModels() {
    return [
      // Anthropic Claude
      'anthropic/claude-sonnet-4',
      'anthropic/claude-opus-4',
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-haiku',

      // OpenAI GPT
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'openai/gpt-4-turbo',
      'openai/gpt-3.5-turbo',

      // Google Gemini
      'google/gemini-pro-1.5',
      'google/gemini-flash-1.5',

      // Meta Llama
      'meta-llama/llama-3.1-70b-instruct',
      'meta-llama/llama-3.1-8b-instruct',

      // Mistral
      'mistralai/mistral-large',
      'mistralai/mistral-7b-instruct',

      // Other popular models
      'qwen/qwen-2-72b-instruct',
      'cognitivecomputations/dolphin-mixtral-8x22b',
    ];
  }

  /**
   * Validate the OpenRouter configuration
   * @returns {Promise<Object>} Validation result
   */
  async validateConfig({ test = false } = {}) {
    const errors = [];

    if (!this.config || !this.config.apiKey) {
      errors.push('API key is required');
    } else if (!this.config.apiKey.startsWith('sk-or-v1-')) {
      console.warn('[OpenRouter] ⚠️ API key does not start with "sk-or-v1-". This may be invalid.');
    }

    // Optionally test the API key
    if (test && this.config && this.config.apiKey && this.initialized) {
      try {
        console.log('[OpenRouter] Testing API key...');
        await this.generateCompletion('Hello', { maxTokens: 5 });
        console.log('[OpenRouter] ✅ API key validation successful');
      } catch (error) {
        console.error('[OpenRouter] ❌ API key validation failed:', error.message);
        errors.push(`API key validation failed: ${error.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get provider metadata
   * @returns {Object} Provider information
   */
  getProviderInfo() {
    return {
      id: 'openrouter',
      name: 'OpenRouter',
      description:
        'Access to 300+ LLMs through unified API including GPT-4, Claude, Gemini, Llama, and more',
      supportsStreaming: true,
      supportsVision: true,
      requiresApiKey: true,
      requiresLocalServer: false,
      documentationUrl: 'https://openrouter.ai/docs',
      modelsUrl: 'https://openrouter.ai/models',
      apiKeyUrl: 'https://openrouter.ai/keys',
      defaultModels: this.getDefaultModels().slice(0, 10),
      configFields: [
        {
          name: 'apiKey',
          label: 'API Key',
          type: 'password',
          required: true,
          placeholder: 'sk-or-v1-...',
          description: 'Get your API key at https://openrouter.ai/keys',
        },
        {
          name: 'model',
          label: 'Model',
          type: 'select',
          required: false,
          options: this.getDefaultModels(),
          description: 'Choose from 300+ models at https://openrouter.ai/models',
        },
        {
          name: 'temperature',
          label: 'Temperature',
          type: 'number',
          required: false,
          default: 0.3,
          min: 0,
          max: 2,
          step: 0.1,
          description: 'Controls randomness. 0.3 = focused, 1.0 = creative. Range varies by model.',
        },
      ],
    };
  }
}

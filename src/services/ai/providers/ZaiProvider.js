/**
 * ZaiProvider - Zhipu AI (Z.ai) GLM models provider
 *
 * Supports Zhipu AI's GLM-4 series models via OpenAI-compatible API.
 * Uses OpenAI SDK for model fetching and API communication.
 *
 * API Documentation: https://z.ai
 */

import OpenAI from 'openai';
import { BaseAIProvider } from './BaseAIProvider';
import { StreamParser } from '../streaming';
import {
  validateProviderConfig,
  createNotInitializedError,
  handleProviderError,
  createInitializationError,
} from '@/utils/aiErrorHandler';

export class ZaiProvider extends BaseAIProvider {
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
   * Initialize the Zhipu AI provider with API configuration
   * @param {Object} config - Configuration object
   * @param {string} config.apiKey - Zhipu AI API key
   * @param {string} config.model - Model name (default: glm-4.7)
   * @param {string} config.endpoint - API endpoint URL (default: https://api.z.ai/api/coding/paas/v4)
   */
  async initialize(config) {
    try {
      validateProviderConfig(config, 'Z.ai');

      this.config = {
        apiKey: config.apiKey,
        model: config.model || 'glm-4.7',
        endpoint: config.endpoint || 'https://api.z.ai/api/coding/paas/v4',
        temperature: config.temperature ?? 0.3,
        ...config,
      };

      // Initialize OpenAI SDK client with Z.ai endpoint
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.endpoint,
        dangerouslyAllowBrowser: true,
      });

      this.initialized = true;
    } catch (error) {
      throw createInitializationError('Z.ai', error);
    }
  }

  /**
   * Generate a streaming completion
   * @param {string} prompt - The input prompt
   * @param {Function} onChunk - Callback function for each chunk
   * @param {Object} options - Additional options
   * @returns {Promise<void>}
   */
  async generateCompletionStream(prompt, onChunk, options = {}) {
    if (!this.initialized) {
      throw createNotInitializedError('Z.ai');
    }

    const endpoint = this.config.endpoint;
    const url = endpoint.endsWith('/chat/completions') ? endpoint : `${endpoint}/chat/completions`;

    console.log('[Z.ai] Starting streaming request');

    try {
      const { systemPrompt, imageDataUrls, ...restOptions } = options;
      const messages = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: prompt });

      // Add image content if provided (vision support)
      if (imageDataUrls && imageDataUrls.length > 0) {
        const content = [{ type: 'text', text: prompt }];
        for (const imageUrl of imageDataUrls) {
          content.push({
            type: 'image_url',
            image_url: { url: imageUrl },
          });
        }
        messages[messages.length - 1] = { role: 'user', content };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          stream: true,
          temperature: this.config.temperature,
          ...restOptions,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Z.ai API error: ${response.status} - ${errorText}`);
      }

      // Use shared StreamParser for OpenAI-compatible format
      const parser = StreamParser.openAICompatible();
      await parser.parseStream(response.body, onChunk);
    } catch (error) {
      throw handleProviderError(error, 'Z.ai');
    }
  }

  /**
   * Generate a non-streaming completion
   * @param {string} prompt - The input prompt
   * @param {Object} options - Additional options
   * @returns {Promise<string>} The generated completion
   */
  async generateCompletion(prompt, options = {}) {
    const endpoint = this.config.endpoint;
    const url = endpoint.endsWith('/chat/completions') ? endpoint : `${endpoint}/chat/completions`;

    console.log('[Z.ai Non-Streaming] Request URL:', url);

    try {
      const { systemPrompt, imageDataUrls, ...restOptions } = options;
      const messages = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: prompt });

      // Add image content if provided (vision support)
      if (imageDataUrls && imageDataUrls.length > 0) {
        const content = [{ type: 'text', text: prompt }];
        for (const imageUrl of imageDataUrls) {
          content.push({
            type: 'image_url',
            image_url: { url: imageUrl },
          });
        }
        messages[messages.length - 1] = { role: 'user', content };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          stream: false,
          temperature: this.config.temperature,
          ...restOptions,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Z.ai API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || data.content || '';
    } catch (error) {
      console.error('[Z.ai] Non-streaming request failed:', error);
      throw handleProviderError(error, 'Z.ai');
    }
  }

  /**
   * Test the connection to Z.ai API
   * @returns {Promise<Object>} Connection test result with detailed diagnostics
   */
  async testConnection() {
    if (!this.config.apiKey || !this.config.endpoint) {
      return {
        success: false,
        error: 'Missing API key or endpoint',
        details: {
          hasApiKey: !!this.config.apiKey,
          hasEndpoint: !!this.config.endpoint,
          endpoint: this.config.endpoint,
        },
      };
    }

    const endpoints = [
      `${this.config.endpoint.replace(/\/$/, '')}/models`,
      `${this.config.endpoint.replace(/\/$/, '')}/chat/completions`,
    ];

    const results = [];

    for (const testUrl of endpoints) {
      try {
        console.log(`[Z.ai] Testing endpoint: ${testUrl}`);

        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        results.push({
          url: testUrl,
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
        });

        console.log(`[Z.ai] Endpoint ${testUrl} responded:`, response.status);

        if (response.ok) {
          return {
            success: true,
            workingEndpoint: testUrl,
            allResults: results,
          };
        }
      } catch (error) {
        console.error(`[Z.ai] Endpoint ${testUrl} error:`, error.message);
        results.push({
          url: testUrl,
          error: error.message,
          errorType: error.name,
        });
      }
    }

    return {
      success: false,
      error: 'All connection tests failed',
      allResults: results,
      suggestions: this.getTroubleshootingSuggestions(),
    };
  }

  /**
   * Get troubleshooting suggestions based on common issues
   * @returns {Array<string>} Array of suggestions
   */
  getTroubleshootingSuggestions() {
    const suggestions = [
      '1. Verify your Z.ai API key is correct and active',
      '2. Check the Z.ai documentation for the correct API endpoint URL',
      `   Current endpoint: ${this.config.endpoint}`,
      '3. Common Z.ai endpoints include:',
      '   - https://api.z.ai/api/coding/paas/v4 (recommended)',
      '   - https://open.bigmodel.cn/api/paas/v4',
      '   - https://api.z.ai/v1',
      '4. Check if there are CORS restrictions for browser-based requests',
      '5. Try using a CORS proxy or backend server',
      '6. Verify your subscription supports the selected model',
      `   Current model: ${this.config.model}`,
      '7. Open browser DevTools Console and Network tab for detailed error logs',
    ];
    return suggestions;
  }

  /**
   * Validate the Z.ai configuration
   * @returns {Promise<Object>} Validation result
   */
  async validateConfig() {
    const errors = [];

    if (!this.config.apiKey) {
      errors.push('API key is required');
    }

    if (this.config.endpoint && !this.isValidUrl(this.config.endpoint)) {
      errors.push('Endpoint must be a valid URL');
    }

    // Try a simple connection test if API key is present
    if (this.config.apiKey && this.config.endpoint && errors.length === 0) {
      const testResult = await this.testConnection();
      if (!testResult.success) {
        console.warn('[Z.ai] Connection test failed:', testResult.error);
        // Add suggestions to console for debugging
        console.warn('[Z.ai] Troubleshooting suggestions:');
        testResult.suggestions?.forEach(s => console.warn('  ', s));
      } else {
        console.log('[Z.ai] Connection test successful');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      diagnostics: {
        endpoint: this.config.endpoint,
        model: this.config.model,
        hasApiKey: !!this.config.apiKey,
      },
    };
  }

  /**
   * Check if a string is a valid URL
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid URL
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get available Z.ai models (GLM models)
   * @returns {Promise<Array<string>>} Array of model names
   *
   * Fetches available models from Z.ai API using OpenAI SDK.
   * Z.ai uses an OpenAI-compatible API with a /models endpoint.
   */
  async getAvailableModels() {
    // Check cache first
    if (this.modelsCache && this.modelsCacheTime) {
      const cacheAge = Date.now() - this.modelsCacheTime;
      if (cacheAge < this.CACHE_DURATION) {
        console.log(`[Z.ai] Using cached models (${Math.round(cacheAge / 1000)}s old)`);
        return this.modelsCache;
      }
      // Cache expired
      console.log('[Z.ai] Cache expired, refetching models...');
      this.modelsCache = null;
      this.modelsCacheTime = null;
    }

    if (!this.client) {
      console.log('[Z.ai] SDK not initialized, using hardcoded model list');
      return this.getDefaultModels();
    }

    // Fetch from Z.ai API using OpenAI SDK
    try {
      console.log('[Z.ai] Fetching models from API via SDK...');

      const modelsList = await this.client.models.list();

      if (modelsList.data && Array.isArray(modelsList.data)) {
        const models = modelsList.data.map(model => model.id);

        if (models.length > 0) {
          console.log(`[Z.ai] ✅ Fetched ${models.length} models from API`);

          // Filter to only GLM models
          const glmModels = models.filter(id => id.startsWith('glm-') || id.startsWith('GLM-'));

          // Cache the results
          this.modelsCache = glmModels.length > 0 ? glmModels : models;
          this.modelsCacheTime = Date.now();

          return this.modelsCache;
        }
      }

      console.warn('[Z.ai] ⚠️ No models found in API response');
      return this.modelsCache || this.getDefaultModels();
    } catch (error) {
      // Handle common API errors
      if (error.status === 401) {
        console.error('[Z.ai] ❌ Authentication failed (401)');
        console.error('[Z.ai] 💡 Your API key may be invalid or expired');
      } else if (error.status === 403) {
        console.error('[Z.ai] ❌ Access forbidden (403)');
        console.error('[Z.ai] 💡 Your API key may not have access to this endpoint');
      } else if (error.status === 429) {
        console.warn('[Z.ai] ⚠️ Rate limited by API (429)');
        console.warn('[Z.ai] 💡 Models are cached to avoid rate limits');
      } else {
        console.error('[Z.ai] ❌ Fetch failed:', error.message);
        console.error('[Z.ai] 💡 Falling back to hardcoded model list');
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
      // Latest GLM models
      'glm-5',
      'glm-4.7',
      'glm-4.7-ari',

      // GLM 4.6
      'glm-4.6',
      'glm-4.6-ari',

      // GLM 4.5
      'glm-4.5',
      'glm-4.5-ari',

      // Common aliases
      'glm-4',
      'glm-4-turbo',
      'glm-4-plus',
      'glm-4-air',

      // Older versions
      'glm-3-turbo',
      'glm-3-plus',
    ];
  }

  /**
   * Get provider metadata
   * @returns {Object} Provider information
   */
  getProviderInfo() {
    return {
      id: 'zai',
      name: 'Zhipu AI (Z.ai)',
      description: 'Zhipu AI GLM-4 series models (GLM-4.7, GLM-4.6, GLM-4.5, GLM-4-Air)',
      supportsStreaming: true,
      requiresApiKey: true,
      requiresLocalServer: false,
      documentationUrl: 'https://z.ai',
      defaultModels: [
        'glm-5',
        'glm-4.7',
        'glm-4.7-ari',
        'glm-4.6',
        'glm-4.6-ari',
        'glm-4.5',
        'glm-4.5-ari',
      ],
      configFields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true },
        {
          name: 'model',
          label: 'Model',
          type: 'select',
          required: false,
          options: ['glm-5', 'glm-4.7', 'glm-4.6', 'glm-4.5', 'glm-4'],
        },
        {
          name: 'endpoint',
          label: 'API Endpoint',
          type: 'text',
          required: false,
          placeholder: 'https://api.z.ai/api/coding/paas/v4',
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
            'Controls randomness. 0.3 = focused, 1.0 = creative. Range: 0-1 for GLM models.',
        },
      ],
    };
  }
}

/**
 * GeminiProvider - Google Gemini models provider
 *
 * Supports Gemini 1.5 Flash/Pro with vision (text + image) capabilities.
 * Uses the official Google Generative AI SDK (@google/genai).
 */

import { BaseAIProvider } from './BaseAIProvider';
import { GoogleGenAI } from '@google/genai';
import {
  validateProviderConfig,
  createNotInitializedError,
  handleProviderError,
  createInitializationError,
} from '@/utils/aiErrorHandler';
import { fetchWithCorsProxy } from '@/utils/corsProxyUtil';

export class GeminiProvider extends BaseAIProvider {
  constructor() {
    super({});
    this.client = null;
    this.modelsCache = null;
    this.modelsCacheTime = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize the Gemini provider
   * @param {Object} config
   * @param {string} config.apiKey - Google AI Studio API key
   * @param {string} config.model - Model name (default: gemini-1.5-flash)
   */
  async initialize(config) {
    try {
      validateProviderConfig(config, 'Gemini');

      this.config = {
        apiKey: config.apiKey,
        model: config.model || 'gemini-1.5-flash',
        temperature: config.temperature ?? 0.3,
        ...config,
      };

      // Initialize GoogleGenAI client
      this.client = new GoogleGenAI({
        apiKey: this.config.apiKey,
      });

      this.initialized = true;
    } catch (error) {
      throw createInitializationError('Gemini', error);
    }
  }

  /**
   * Build the parts array for a Gemini request.
   * Supports plain text and optional base64 image data URLs.
   * @param {string} prompt
   * @param {string[]} imageDataUrls - Array of base64 PNG data URLs
   * @returns {Array}
   */
  _buildParts(prompt, imageDataUrls = []) {
    const parts = [];

    // Add images first (before text prompt)
    for (const dataUrl of imageDataUrls) {
      const [header, data] = dataUrl.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
      parts.push({ inlineData: { mimeType, data } });
    }

    // Add text prompt
    parts.push({ text: prompt });
    return parts;
  }

  /**
   * Generate a streaming completion, optionally with images.
   * @param {string} prompt
   * @param {Function} onChunk
   * @param {Object} options
   * @param {string[]} options.imageDataUrls - Array of base64 PNG data URLs (vision support)
   * @param {string} options.systemPrompt
   */
  async generateCompletionStream(prompt, onChunk, options = {}) {
    if (!this.initialized) {
      throw createNotInitializedError('Gemini');
    }

    const { imageDataUrls = [], systemPrompt } = options;
    const parts = this._buildParts(prompt, imageDataUrls);

    const requestConfig = {
      model: this.config.model,
      contents: [{ role: 'user', parts }],
      config: {
        generationConfig: { temperature: this.config.temperature },
      },
    };

    // Add system instruction if provided
    if (systemPrompt) {
      requestConfig.config.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    try {
      // Use SDK's streaming support
      const response = await this.client.models.generateContentStream(requestConfig);

      for await (const chunk of response) {
        const text = chunk.text;
        if (text) {
          onChunk(text);
        }
      }
    } catch (error) {
      throw handleProviderError(error, 'Gemini');
    }
  }

  /**
   * Generate a non-streaming completion, optionally with images.
   * @param {string} prompt
   * @param {Object} options
   * @returns {Promise<string>}
   */
  async generateCompletion(prompt, options = {}) {
    const { imageDataUrls = [], systemPrompt } = options;
    const parts = this._buildParts(prompt, imageDataUrls);

    const requestConfig = {
      model: this.config.model,
      contents: [{ role: 'user', parts }],
      config: {
        generationConfig: { temperature: this.config.temperature },
      },
    };

    // Add system instruction if provided
    if (systemPrompt) {
      requestConfig.config.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    try {
      const response = await this.client.models.generateContent(requestConfig);
      return response.text || '';
    } catch (error) {
      throw handleProviderError(error, 'Gemini');
    }
  }

  /**
   * Validate the Gemini configuration
   * @returns {Promise<Object>} Validation result
   */
  async validateConfig() {
    const errors = [];

    if (!this.config.apiKey) {
      errors.push('API key is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get available Gemini models
   * @returns {Promise<Array<string>>} Array of model names
   *
   * Fetches models from Google's REST API with caching.
   * Tries direct fetch first, falls back to CORS proxy, then hardcoded list.
   * Results are cached for 5 minutes to avoid rate limiting.
   */
  async getAvailableModels() {
    // Check cache first
    if (this.modelsCache && this.modelsCacheTime) {
      const cacheAge = Date.now() - this.modelsCacheTime;
      if (cacheAge < this.CACHE_DURATION) {
        console.log(`[Gemini] Using cached models (${Math.round(cacheAge / 1000)}s old)`);
        return this.modelsCache;
      }
      // Cache expired
      console.log('[Gemini] Cache expired, refetching models...');
      this.modelsCache = null;
      this.modelsCacheTime = null;
    }

    if (!this.config?.apiKey) {
      console.log('[Gemini] No API key, using hardcoded model list');
      return this.getHardcodedModels();
    }

    // Try direct fetch first
    try {
      console.log('[Gemini] Attempting direct fetch to REST API...');
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.config.apiKey}`;
      const response = await fetch(url);

      // Handle common HTTP errors with helpful messages
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');

        switch (response.status) {
          case 401:
            console.error('[Gemini] ❌ Authentication failed (401)');
            console.error('[Gemini] 💡 Check that your API key is valid and not expired');
            console.error('[Gemini] 💡 Get a new key at: https://aistudio.google.com/apikey');
            return this.modelsCache || this.getHardcodedModels();

          case 403:
            console.error('[Gemini] ❌ Access forbidden (403)');
            console.error('[Gemini] 💡 Your API key may not have access to the models API');
            console.error(
              '[Gemini] 💡 Check your API key permissions at: https://aistudio.google.com/apikey'
            );
            return this.modelsCache || this.getHardcodedModels();

          case 429: {
            const waitTime = Math.ceil(this.CACHE_DURATION / 1000);
            console.warn(`[Gemini] ⚠️ Rate limited by API (429)`);
            console.warn(
              `[Gemini] 💡 Tip: Models are cached for ${waitTime}s to avoid rate limits`
            );
            console.warn('[Gemini] 💡 The hardcoded model list includes all latest Gemini models');
            return this.modelsCache || this.getHardcodedModels();
          }

          case 500:
          case 502:
          case 503:
            console.error(
              `[Gemini] ❌ Server error (${response.status}) - Google API is experiencing issues`
            );
            console.error('[Gemini] 💡 Try again in a few moments or use the hardcoded model list');
            return this.modelsCache || this.getHardcodedModels();

          default:
            console.error(
              `[Gemini] ❌ API error (${response.status}): ${errorText || 'Unknown error'}`
            );
            console.error('[Gemini] 💡 Falling back to hardcoded model list');
            return this.modelsCache || this.getHardcodedModels();
        }
      }

      if (response.ok) {
        const data = await response.json();
        const models = this.extractGeminiModels(data);

        if (models.length > 0) {
          console.log(`[Gemini] ✅ Fetched ${models.length} models via direct fetch`);

          // Cache the results
          this.modelsCache = models;
          this.modelsCacheTime = Date.now();

          return models;
        }
      }
    } catch (error) {
      console.log('[Gemini] Direct fetch failed:', error.message);
      console.log('[Gemini] Retrying with CORS proxy...');
    }

    // Try CORS proxy
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.config.apiKey}`;
      const response = await fetchWithCorsProxy(url);

      // Handle rate limiting specifically
      if (response.status === 429) {
        const waitTime = Math.ceil(this.CACHE_DURATION / 1000);
        console.warn(`[Gemini] ⚠️ Rate limited by API (429)`);
        console.warn(`[Gemini] 💡 Tip: Models are cached for ${waitTime}s to avoid rate limits`);
        console.warn('[Gemini] 💡 The hardcoded model list includes all latest Gemini models');
        return this.modelsCache || this.getHardcodedModels();
      }

      const data = await response.json();
      const models = this.extractGeminiModels(data);

      if (models.length > 0) {
        console.log(`[Gemini] ✅ Fetched ${models.length} models via CORS proxy`);

        // Cache the results
        this.modelsCache = models;
        this.modelsCacheTime = Date.now();

        return models;
      }
    } catch (error) {
      console.warn('[Gemini] ⚠️ CORS proxy fetch also failed:', error.message);
    }

    // Final fallback to hardcoded list
    console.log('[Gemini] Using hardcoded model list');
    return this.getHardcodedModels();
  }

  /**
   * Extract Gemini model names from API response
   * @param {Object} data - API response data
   * @returns {Array<string>} Model names
   */
  extractGeminiModels(data) {
    if (!data.models || !Array.isArray(data.models)) {
      return [];
    }

    const modelNames = [];

    for (const model of data.models) {
      // Filter for generative models (chat models)
      if (
        model.name &&
        (model.name.includes('gemini') ||
          model.name.includes('flash') ||
          model.name.includes('pro'))
      ) {
        // Extract just the model name from the full path
        // Format: models/gemini-2.0-flash -> gemini-2.0-flash
        const modelName = model.name.split('/').pop();
        if (modelName && !modelNames.includes(modelName)) {
          modelNames.push(modelName);
        }
      }
    }

    return modelNames.sort();
  }

  /**
   * Get hardcoded list of Gemini models
   * @returns {Array<string>} Model names
   */
  getHardcodedModels() {
    return [
      // Gemini 2.0 models (latest)
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash-exp',

      // Gemini 1.5 models
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro',

      // Older models
      'gemini-1.0-pro',
    ];
  }

  /**
   * Get provider metadata
   * @returns {Object} Provider information
   */
  getProviderInfo() {
    return {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Gemini 2.0 and 1.5 with official SDK support and vision capabilities',
      supportsStreaming: true,
      supportsVision: true,
      requiresApiKey: true,
      requiresLocalServer: false,
      documentationUrl: 'https://ai.google.dev/gemini-api/docs',
      sdkPackage: '@google/genai',
      defaultModels: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
      configFields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true },
        {
          name: 'model',
          label: 'Model',
          type: 'select',
          required: false,
          options: [
            'gemini-2.0-flash',
            'gemini-2.0-flash-lite',
            'gemini-1.5-flash',
            'gemini-1.5-flash-8b',
            'gemini-1.5-pro',
          ],
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
            'Controls randomness. 0.3 = focused, 1.0 = creative. Range: 0-1 for Gemini models.',
        },
      ],
    };
  }
}

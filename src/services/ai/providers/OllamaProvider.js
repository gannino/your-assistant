/**
 * OllamaProvider - Local models via Ollama
 *
 * Supports running models locally using Ollama.
 * No API key required - runs on localhost:11434 by default.
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

export class OllamaProvider extends BaseAIProvider {
  constructor() {
    super({});
  }

  /**
   * Initialize the Ollama provider with endpoint configuration
   * @param {Object} config - Configuration object
   * @param {string} config.endpoint - Ollama server endpoint (default: http://localhost:11434)
   * @param {string} config.model - Model name (default: llama2)
   */
  async initialize(config) {
    this.config = {
      endpoint: config.endpoint || 'http://localhost:11434',
      model: config.model || 'llama2',
      temperature: config.temperature ?? 0.3,
      ...config,
    };

    this.initialized = true;
  }

  /**
   * Generate a streaming completion
   * @param {string} prompt - The input prompt
   * @param {Function} onChunk - Callback function for each chunk
   * @param {Object} options - Additional options
   * @returns {Promise<void>}
   */
  async generateCompletionStream(prompt, onChunk, options = {}) {
    requireInitialized(this.initialized, 'Ollama');

    const endpoint = this.config.endpoint.replace(/\/$/, '');
    const url = `${endpoint}/api/chat`;

    try {
      const { systemPrompt, ...restOptions } = options;
      const messages = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: prompt });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        await handleHttpError(response, 'Ollama', {
          fallbackModels: this.getDefaultModels(),
        });
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      // Use shared StreamParser for Ollama format (plain JSON lines)
      const parser = StreamParser.ollama();
      await parser.parseStream(response.body, onChunk);
    } catch (error) {
      handleNetworkError(error, 'Ollama', 'Streaming request');
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
   * Get available models from Ollama
   * @returns {Promise<Array<string>>} Array of model names
   */
  async getAvailableModels() {
    // Check cache first
    const cached = getCachedModels('ollama');
    if (cached) {
      return cached;
    }

    const endpoint = (this.config?.endpoint || 'http://localhost:11434').replace(/\/$/, '');
    const url = `${endpoint}/api/tags`;

    try {
      console.log('[Ollama] Attempting to fetch models from server...');
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const fallbackModels = await handleHttpError(response, 'Ollama', {
          fallbackModels: this.getDefaultModels(),
          docsUrl: 'https://ollama.ai/docs',
        });
        // Cache the fallback list
        setCachedModels('ollama', fallbackModels);
        return fallbackModels;
      }

      const data = await response.json();
      const models = data.models?.map(m => m.name) || [];

      if (models.length > 0) {
        const sortedModels = models.sort();
        logSuccess('Ollama', 'Fetched models from server', sortedModels.length);
        // Cache the results
        setCachedModels('ollama', sortedModels);
        return sortedModels;
      }

      // No models found, use fallback
      const defaultModels = this.getDefaultModels();
      console.warn('[Ollama] ⚠️ No models found on server, using default list');
      setCachedModels('ollama', defaultModels);
      return defaultModels;
    } catch (error) {
      handleNetworkError(error, 'Ollama', 'Fetching models');
      const defaultModels = this.getDefaultModels();
      setCachedModels('ollama', defaultModels);
      return defaultModels;
    }
  }

  /**
   * Get default model list
   * @returns {Array<string>} Default model names
   */
  getDefaultModels() {
    return ['llama2', 'mistral', 'codellama', 'neural-chat', 'gemma', 'phi'];
  }

  /**
   * Validate the Ollama configuration
   * @returns {Promise<Object>} Validation result
   */
  async validateConfig() {
    const errors = [];

    if (!this.config.endpoint) {
      errors.push('Endpoint is required');
    } else if (!this.isValidUrl(this.config.endpoint)) {
      errors.push('Endpoint must be a valid URL');
    }

    // Optionally check if Ollama is running
    if (this.config.endpoint && this.isValidUrl(this.config.endpoint)) {
      try {
        const endpoint = this.config.endpoint.replace(/\/$/, '');
        const response = await fetch(`${endpoint}/api/tags`, { method: 'GET' });
        if (!response.ok) {
          errors.push('Ollama server is not responding. Make sure Ollama is running.');
        }
      } catch (error) {
        errors.push(`Cannot connect to Ollama server: ${error.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
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
   * Get provider metadata
   * @returns {Object} Provider information
   */
  getProviderInfo() {
    return {
      id: 'ollama',
      name: 'Ollama',
      description: 'Run models locally with Ollama. No API key required.',
      supportsStreaming: true,
      requiresApiKey: false,
      requiresLocalServer: true,
      defaultModels: ['llama2', 'mistral', 'codellama', 'neural-chat'],
      configFields: [
        {
          name: 'endpoint',
          label: 'Endpoint',
          type: 'text',
          required: false,
          placeholder: 'http://localhost:11434',
        },
        {
          name: 'model',
          label: 'Model',
          type: 'select',
          required: false,
          options: ['llama2', 'mistral', 'codellama', 'neural-chat', 'gemma'],
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
          description:
            'Controls randomness. 0.3 = focused, 1.0 = balanced, 2 = creative. Range varies by model.',
        },
      ],
      documentationUrl: 'https://ollama.ai/docs',
    };
  }
}

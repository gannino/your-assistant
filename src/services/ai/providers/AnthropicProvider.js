/**
 * AnthropicProvider - Anthropic Claude models provider
 *
 * Supports Claude 3 models (Haiku, Sonnet, Opus).
 * Uses Anthropic's official TypeScript SDK for API communication.
 */

import { BaseAIProvider } from './BaseAIProvider';
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider extends BaseAIProvider {
  constructor() {
    super({});
    this.client = null;
  }

  /**
   * Initialize the Anthropic provider with API configuration
   * @param {Object} config - Configuration object
   * @param {string} config.apiKey - Anthropic API key
   * @param {string} config.model - Model name (default: claude-3-5-sonnet-20241022)
   */
  async initialize(config) {
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'claude-sonnet-4.6-20250514', // Latest Claude model
      maxTokens: 8192,
      temperature: config.temperature ?? 0.3,
      ...config,
    };

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      dangerouslyAllowBrowser: true,
    });

    this.initialized = true;
  }

  /**
   * Generate a non-streaming completion
   * @param {string} prompt - The input prompt
   * @param {Object} options - Additional options
   * @returns {Promise<string>} The generated completion
   */
  async generateCompletion(prompt, options = {}) {
    if (!this.client) {
      throw new Error('Anthropic provider not initialized. Call initialize() first.');
    }

    const { systemPrompt, maxTokens, ...restOptions } = options;

    const response = await this.executeWithRetry(
      async () => {
        return await this.client.messages.create({
          model: this.config.model,
          max_tokens: maxTokens || this.config.maxTokens,
          temperature: this.config.temperature,
          messages: [{ role: 'user', content: prompt }],
          system: systemPrompt,
          ...restOptions,
        });
      },
      {
        onRetry: (attempt, error) => {
          console.warn(
            `[Anthropic] Retrying completion generation (attempt ${attempt}): ${error.message}`
          );
        },
      }
    );

    return response.content[0]?.text || '';
  }

  /**
   * Generate a streaming completion
   * @param {string} prompt - The input prompt
   * @param {Function} onChunk - Callback function for each chunk
   * @param {Object} options - Additional options
   * @returns {Promise<void>}
   */
  async generateCompletionStream(prompt, onChunk, options = {}) {
    if (!this.client) {
      throw new Error('Anthropic provider not initialized. Call initialize() first.');
    }

    const { systemPrompt, maxTokens, ...restOptions } = options;

    // Use retry logic for the initial request
    const stream = await this.executeWithRetry(
      async () => {
        return await this.client.messages.stream({
          model: this.config.model,
          max_tokens: maxTokens || this.config.maxTokens,
          temperature: this.config.temperature,
          messages: [{ role: 'user', content: prompt }],
          system: systemPrompt,
          ...restOptions,
        });
      },
      {
        onRetry: (attempt, error) => {
          console.warn(
            `[Anthropic] Retrying stream generation (attempt ${attempt}): ${error.message}`
          );
        },
      }
    );

    try {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
          onChunk(chunk.delta.text);
        }
      }
    } catch (error) {
      throw new Error(`Anthropic streaming failed: ${error.message}`);
    }
  }

  /**
   * Validate the Anthropic configuration
   * @returns {Promise<Object>} Validation result
   */
  async validateConfig() {
    const errors = [];

    if (!this.config.apiKey) {
      errors.push('API key is required');
    }

    if (this.config.apiKey && !this.config.apiKey.startsWith('sk-ant-')) {
      errors.push('API key should start with "sk-ant-"');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get available Anthropic models
   * @returns {Promise<Array<string>>} Array of model names
   */
  async getAvailableModels() {
    return [
      // Latest Claude 4.6 models (2025)
      'claude-sonnet-4.6-20250514',
      'claude-sonnet-4.5-20250514',

      // Claude 3.7 models (2025)
      'claude-3-7-sonnet-20250219',
      'claude-3-7-haiku-20250219',

      // Claude 3.5 models (2024)
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',

      // Earlier Claude 3 models
      'claude-3-sonnet-20240229',
      'claude-3-opus-20240229',
    ];
  }

  /**
   * Get provider metadata
   * @returns {Object} Provider information
   */
  getProviderInfo() {
    return {
      id: 'anthropic',
      name: 'Anthropic',
      description: 'Claude 4.6 Sonnet, 4.5, and 3.7 models (latest)',
      supportsStreaming: true,
      requiresApiKey: true,
      requiresLocalServer: false,
      documentationUrl: 'https://docs.anthropic.com/claude/reference/messages_post',
      defaultModels: [
        'claude-sonnet-4.6-20250514',
        'claude-sonnet-4.5-20250514',
        'claude-3-7-sonnet-20250219',
      ],
      configFields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true },
        {
          name: 'model',
          label: 'Model',
          type: 'select',
          required: false,
          options: [
            'claude-sonnet-4.6-20250514',
            'claude-sonnet-4.5-20250514',
            'claude-3-7-sonnet-20250219',
            'claude-3-5-sonnet-20241022',
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
            'Controls randomness. 0.3 = focused, 1.0 = creative. Range: 0-1 for Claude models.',
        },
      ],
    };
  }
}

/**
 * AnthropicProvider - Anthropic Claude models provider
 *
 * Supports Claude 3 models (Haiku, Sonnet, Opus).
 * Uses Anthropic's Messages API with streaming support.
 */

import { BaseAIProvider } from './BaseAIProvider';
import { StreamParser } from '../streaming';

export class AnthropicProvider extends BaseAIProvider {
  constructor() {
    super({});
  }

  /**
   * Initialize the Anthropic provider with API configuration
   * @param {Object} config - Configuration object
   * @param {string} config.apiKey - Anthropic API key
   * @param {string} config.model - Model name (default: claude-3-sonnet-20240229)
   */
  async initialize(config) {
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'claude-3-sonnet-20240229',
      apiVersion: '2023-06-01',
      maxTokens: 4096,
      temperature: config.temperature ?? 0.3, // Anthropic supports 0-1 range
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
    if (!this.initialized) {
      throw new Error('Anthropic provider not initialized. Call initialize() first.');
    }

    const url = 'https://api.anthropic.com/v1/messages';
    const { systemPrompt, ...restOptions } = options;

    try {
      // Use retry logic for the initial request
      const response = await this.executeWithRetry(
        async () => {
          const { controller, cleanup } = this.createTimeoutController(60000); // 60 second timeout

          try {
            const resp = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.config.apiKey,
                'anthropic-version': this.config.apiVersion,
              },
              body: JSON.stringify({
                model: this.config.model,
                max_tokens: this.config.maxTokens,
                ...(systemPrompt ? { system: systemPrompt } : {}),
                messages: [{ role: 'user', content: prompt }],
                stream: true,
                temperature: this.config.temperature,
                ...restOptions,
              }),
              signal: controller.signal,
            });
            return resp;
          } finally {
            cleanup();
          }
        },
        {
          onRetry: (attempt, error) => {
            console.warn(
              `[Anthropic] Retrying stream generation (attempt ${attempt}): ${error.message}`
            );
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Anthropic API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      // Use shared StreamParser for Anthropic format
      const parser = StreamParser.anthropic();
      await parser.parseStream(response.body, onChunk);
    } catch (error) {
      throw new Error(`Anthropic request failed: ${error.message}`);
    }
  }

  /**
   * Parse server-sent events (SSE) format from Anthropic streaming response
   * @param {string} chunk - Raw chunk from the stream
   * @returns {string} Extracted content text
   */
  parseStreamChunk(chunk) {
    // Initialize buffer if not exists
    if (!this.streamBuffer) {
      this.streamBuffer = '';
    }

    // Add new chunk to buffer
    this.streamBuffer += chunk;

    const lines = this.streamBuffer.split('\n');
    let content = '';
    let completeLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and non-data lines
      if (!line || !line.startsWith('data: ')) {
        continue;
      }

      const data = line.slice(6); // Remove 'data: ' prefix

      // Try to parse as JSON
      try {
        const parsed = JSON.parse(data);

        // Anthropic streaming format
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          content += parsed.delta.text;
        }
        // Successfully parsed, so this line is complete
        completeLines.push(i);
      } catch (e) {
        // JSON parse error - likely incomplete chunk
        // Keep this line in buffer for next chunk
        // Don't add to completeLines
      }
    }

    // Remove complete lines from buffer (in reverse order to maintain indices)
    for (let i = completeLines.length - 1; i >= 0; i--) {
      lines.splice(completeLines[i], 1);
    }

    // Keep incomplete lines in buffer
    this.streamBuffer = lines.join('\n');

    return content;
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
    // Anthropic doesn't have a public models endpoint, return comprehensive list
    return [
      // Claude 3 models
      'claude-3-haiku-20240307',
      'claude-3-sonnet-20240229',
      'claude-3-opus-20240229',

      // Claude 3.5 models
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',

      // Claude 2 models (older)
      'claude-2.1',
      'claude-2.0',
      'claude-2',

      // Claude Instant (faster/cheaper)
      'claude-instant-1.2',

      // Claude with different versions
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-3-opus-20240229',
      'claude-3-5-sonnet-20240620',

      // Alias-friendly names
      'claude-3-haiku',
      'claude-3-sonnet',
      'claude-3-opus',
      'claude-3-5-sonnet',
      'claude-3-5-haiku',
      'claude-instant',
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
      description: 'Claude 3 models (Haiku, Sonnet, Opus)',
      supportsStreaming: true,
      requiresApiKey: true,
      requiresLocalServer: false,
      defaultModels: [
        'claude-3-haiku-20240307',
        'claude-3-sonnet-20240229',
        'claude-3-opus-20240229',
      ],
      configFields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true },
        {
          name: 'model',
          label: 'Model',
          type: 'select',
          required: false,
          options: [
            'claude-3-haiku-20240307',
            'claude-3-sonnet-20240229',
            'claude-3-opus-20240229',
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
      documentationUrl: 'https://docs.anthropic.com/claude/reference/messages_post',
    };
  }
}

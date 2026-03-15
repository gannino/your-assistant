/**
 * MLXProvider - Apple Silicon local inference via MLX
 *
 * Supports running models locally on Apple Silicon using MLX framework.
 * No API key required - runs on localhost by default.
 */

import { BaseAIProvider } from './BaseAIProvider';
import { StreamParser } from '../streaming';

export class MLXProvider extends BaseAIProvider {
  constructor() {
    super({});
  }

  /**
   * Initialize the MLX provider with endpoint configuration
   * @param {Object} config - Configuration object
   * @param {string} config.endpoint - MLX server endpoint (default: http://localhost:8080)
   * @param {string} config.model - Model name (default: mlx-quantized)
   */
  async initialize(config) {
    this.config = {
      endpoint: config.endpoint || 'http://localhost:8080',
      model: config.model || 'mlx-quantized',
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
    if (!this.initialized) {
      throw new Error('MLX provider not initialized. Call initialize() first.');
    }

    const endpoint = this.config.endpoint.replace(/\/$/, '');
    const url = `${endpoint}/v1/chat/completions`;

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
        const errorText = await response.text();
        throw new Error(`MLX API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Use shared StreamParser for OpenAI-compatible format
      const parser = StreamParser.openAICompatible();
      await parser.parseStream(response.body, onChunk);
    } catch (error) {
      throw new Error(`MLX request failed: ${error.message}`);
    }
  }

  /**
   * Parse server-sent events (SSE) format from streaming response
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

      // Check for stream end
      if (data === '[DONE]') {
        continue;
      }

      // Try to parse as JSON
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;
        if (delta?.content) {
          content += delta.content;
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
   * Get available MLX models
   * @returns {Promise<Array<string>>} Array of model names
   */
  async getAvailableModels() {
    // Try to fetch from MLX server if available, otherwise return common models
    const endpoint = (this.config?.endpoint || 'http://localhost:8080').replace(/\/$/, '');

    try {
      const response = await fetch(`${endpoint}/v1/models`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          return data.data.map(m => m.id);
        }
      }
    } catch (error) {
      console.warn('Could not fetch MLX models from server:', error.message);
    }

    // Return comprehensive list of common MLX models
    return [
      // Quantized variants
      'mlx-quantized',
      'mlx-quantized-4bit',
      'mlx-quantized-8bit',

      // Full precision
      'mlx-full',
      'mlx-full-precision',

      // Llama family
      'llama-mlx',
      'llama-mlx-7b',
      'llama-mlx-13b',
      'llama-mlx-70b',

      // Mistral family
      'mistral-mlx',
      'mistral-mlx-7b',
      'mixtral-mlx-8x7b',

      // Other models
      'phi-mlx',
      'gemma-mlx',
      'qwen-mlx',
    ];
  }

  /**
   * Validate the MLX configuration
   * @returns {Promise<Object>} Validation result
   */
  async validateConfig() {
    const errors = [];

    if (!this.config.endpoint) {
      errors.push('Endpoint is required');
    } else if (!this.isValidUrl(this.config.endpoint)) {
      errors.push('Endpoint must be a valid URL');
    }

    // Check if running on Apple Silicon (basic check)
    const platform = navigator.platform || '';
    const isAppleSilicon =
      platform.includes('Mac') || platform.includes('iPhone') || platform.includes('iPad');
    if (!isAppleSilicon) {
      errors.push('MLX is designed for Apple Silicon devices');
    }

    // Optionally check if MLX server is running
    if (this.config.endpoint && this.isValidUrl(this.config.endpoint) && isAppleSilicon) {
      try {
        const endpoint = this.config.endpoint.replace(/\/$/, '');
        const response = await fetch(`${endpoint}/v1/models`, { method: 'GET' });
        if (!response.ok) {
          errors.push('MLX server is not responding. Make sure MLX server is running.');
        }
      } catch (error) {
        errors.push(`Cannot connect to MLX server: ${error.message}`);
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
      id: 'mlx',
      name: 'MLX',
      description: 'Run models locally on Apple Silicon with MLX framework',
      supportsStreaming: true,
      requiresApiKey: false,
      requiresLocalServer: true,
      requiresAppleSilicon: true,
      defaultModels: ['mlx-quantized', 'mlx-full', 'llama-mlx'],
      configFields: [
        {
          name: 'endpoint',
          label: 'Endpoint',
          type: 'text',
          required: false,
          placeholder: 'http://localhost:8080',
        },
        {
          name: 'model',
          label: 'Model',
          type: 'select',
          required: false,
          options: ['mlx-quantized', 'mlx-full', 'llama-mlx', 'mistral-mlx'],
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
      documentationUrl: 'https://github.com/ml-explore/mlx',
    };
  }
}

/**
 * OllamaProvider - Local models via Ollama
 *
 * Supports running models locally using Ollama.
 * No API key required - runs on localhost:11434 by default.
 */

import { BaseAIProvider } from './BaseAIProvider';

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
    if (!this.initialized) {
      throw new Error('Ollama provider not initialized. Call initialize() first.');
    }

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
        const errorText = await response.text();
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Initialize stream buffer
      let streamBuffer = '';

      try {
        let shouldContinue = true;
        let { done, value } = await reader.read();

        while (!done && shouldContinue) {
          streamBuffer += decoder.decode(value, { stream: true });
          const lines = streamBuffer.split('\n');
          let completeLines = [];

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            try {
              const parsed = JSON.parse(line);
              if (parsed.message?.content) {
                onChunk(parsed.message.content);
              }
              if (parsed.done) {
                shouldContinue = false;
                break;
              }
              // Successfully parsed, mark as complete
              completeLines.push(i);
            } catch (e) {
              // JSON parse error - incomplete chunk, keep in buffer
            }
          }

          // Remove complete lines from buffer (in reverse order)
          for (let i = completeLines.length - 1; i >= 0; i--) {
            lines.splice(completeLines[i], 1);
          }
          streamBuffer = lines.join('\n');

          // Read next chunk if we should continue
          if (shouldContinue) {
            ({ done, value } = await reader.read());
          }
        }
      } finally {
        // Clean up buffer
        streamBuffer = '';
      }
    } catch (error) {
      throw new Error(`Ollama request failed: ${error.message}`);
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
    const endpoint = (this.config?.endpoint || 'http://localhost:11434').replace(/\/$/, '');
    const url = `${endpoint}/api/tags`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        console.warn('Failed to fetch Ollama models:', response.statusText);
        return this.getDefaultModels();
      }

      const data = await response.json();
      const models = data.models?.map(m => m.name) || [];

      if (models.length > 0) {
        return models.sort();
      }

      return this.getDefaultModels();
    } catch (error) {
      console.warn('Error fetching Ollama models:', error.message);
      return this.getDefaultModels();
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

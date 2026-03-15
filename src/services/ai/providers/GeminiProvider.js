/**
 * GeminiProvider - Google Gemini models provider
 *
 * Supports Gemini 1.5 Flash/Pro with vision (text + image) capabilities.
 * Uses the Google Generative AI REST API directly (no SDK needed).
 */

import { BaseAIProvider } from './BaseAIProvider';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiProvider extends BaseAIProvider {
  constructor() {
    super({});
  }

  /**
   * Initialize the Gemini provider
   * @param {Object} config
   * @param {string} config.apiKey - Google AI Studio API key
   * @param {string} config.model - Model name (default: gemini-1.5-flash)
   */
  async initialize(config) {
    if (!config.apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gemini-1.5-flash',
      temperature: config.temperature ?? 0.3,
      ...config,
    };

    this.initialized = true;
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

    for (const dataUrl of imageDataUrls) {
      const [header, data] = dataUrl.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
      parts.push({ inlineData: { mimeType, data } });
    }

    parts.push({ text: prompt });
    return parts;
  }

  /**
   * Generate a streaming completion, optionally with images.
   * @param {string} prompt
   * @param {Function} onChunk
   * @param {Object} options
   * @param {string[]} options.images - Array of base64 PNG data URLs
   * @param {string} options.systemPrompt
   */
  async generateCompletionStream(prompt, onChunk, options = {}) {
    if (!this.initialized) {
      throw new Error('Gemini provider not initialized. Call initialize() first.');
    }

    const { images = [], systemPrompt } = options;
    const parts = this._buildParts(prompt, images);

    const body = {
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: this.config.temperature },
    };

    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const url = `${GEMINI_BASE_URL}/${this.config.model}:streamGenerateContent?alt=sse&key=${this.config.apiKey}`;

    const response = await this.executeWithRetry(async () => {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Gemini API error: ${resp.status} ${resp.statusText} - ${errorText}`);
      }

      return resp;
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const content = this._parseSSEChunk(chunk);
      if (content) onChunk(content);
    }
  }

  /**
   * Generate a non-streaming completion, optionally with images.
   * @param {string} prompt
   * @param {Object} options
   * @returns {Promise<string>}
   */
  async generateCompletion(prompt, options = {}) {
    let result = '';
    await this.generateCompletionStream(
      prompt,
      chunk => {
        result += chunk;
      },
      options
    );
    return result;
  }

  /**
   * Parse SSE chunks from Gemini streaming response.
   * @param {string} chunk
   * @returns {string}
   */
  _parseSSEChunk(chunk) {
    let content = '';
    for (const line of chunk.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) content += text;
      } catch {
        // incomplete chunk, skip
      }
    }
    return content;
  }

  /**
   * @returns {Promise<Object>}
   */
  async validateConfig() {
    const errors = [];
    if (!this.config?.apiKey) errors.push('API key is required');
    return { valid: errors.length === 0, errors };
  }

  /**
   * @returns {Promise<string[]>}
   */
  async getAvailableModels() {
    return [
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
    ];
  }

  /**
   * @returns {Object}
   */
  getProviderInfo() {
    return {
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Gemini 1.5 Flash/Pro with vision support (text + screenshots)',
      supportsStreaming: true,
      supportsVision: true,
      requiresApiKey: true,
      requiresLocalServer: false,
      defaultModels: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
      configFields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true },
        {
          name: 'model',
          label: 'Model',
          type: 'select',
          required: false,
          options: [
            'gemini-1.5-flash',
            'gemini-1.5-flash-8b',
            'gemini-1.5-pro',
            'gemini-2.0-flash',
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
        },
      ],
      documentationUrl: 'https://ai.google.dev/gemini-api/docs',
    };
  }
}

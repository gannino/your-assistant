/**
 * Streaming Utility Class for AI Providers
 *
 * Provides a unified interface for parsing Server-Sent Events (SSE) and
 * streaming JSON responses across different AI providers.
 *
 * Each provider can configure:
 * - extractContent: How to extract text from parsed JSON objects
 * - isEndMarker: Optional check for stream end markers
 * - linePrefix: Prefix for data lines (default: 'data: ')
 */

export class StreamParser {
  constructor(config = {}) {
    this.extractContent = config.extractContent || this.defaultExtractContent;
    this.isEndMarker = config.isEndMarker || (() => false);
    this.linePrefix = config.linePrefix || 'data: ';
  }

  /**
   * Default content extractor for OpenAI-compatible format
   * @param {Object} parsed - Parsed JSON object
   * @returns {string|null} Extracted content
   */
  defaultExtractContent(parsed) {
    return parsed.choices?.[0]?.delta?.content || null;
  }

  /**
   * Parse SSE stream and call onChunk for each content piece
   * @param {ReadableStream} stream - The response body stream
   * @param {Function} onChunk - Callback(content) for each piece of content
   * @returns {Promise<void>}
   */
  async parseStream(stream, onChunk) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process buffer line by line
        const lines = buffer.split('\n');
        // Keep the last line if it's incomplete
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith(this.linePrefix)) continue;

          const data = trimmedLine.slice(this.linePrefix.length);

          // Check for end marker
          if (this.isEndMarker(data)) continue;

          // Try to parse and extract content
          try {
            const parsed = JSON.parse(data);
            const content = this.extractContent(parsed);
            if (content) onChunk(content);
          } catch {
            // Skip invalid JSON lines (incomplete chunks)
          }
        }
      }
    } finally {
      buffer = '';
    }
  }

  /**
   * Factory method for common provider formats
   */

  /**
   * Create parser for OpenAI-compatible providers (Z.ai, MLX)
   * @returns {StreamParser}
   */
  static openAICompatible() {
    return new StreamParser({
      extractContent: parsed => parsed.choices?.[0]?.delta?.content || null,
      isEndMarker: data => data === '[DONE]',
    });
  }

  /**
   * Create parser for Anthropic
   * @returns {StreamParser}
   */
  static anthropic() {
    return new StreamParser({
      extractContent: parsed => {
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          return parsed.delta.text;
        }
        return null;
      },
      isEndMarker: () => false, // Anthropic doesn't use [DONE]
    });
  }

  /**
   * Create parser for Gemini
   * @returns {StreamParser}
   */
  static gemini() {
    return new StreamParser({
      extractContent: parsed => parsed.candidates?.[0]?.content?.parts?.[0]?.text || null,
      isEndMarker: data => data === '[DONE]',
    });
  }

  /**
   * Create parser for Ollama (plain JSON lines, no SSE prefix)
   * @returns {StreamParser}
   */
  static ollama() {
    return new StreamParser({
      linePrefix: '', // No prefix for Ollama
      extractContent: parsed => {
        if (parsed.message?.content) {
          return parsed.message.content;
        }
        return null;
      },
      isEndMarker: parsed => parsed.done === true,
    });
  }

  /**
   * Create parser for custom provider format
   * @param {Function} extractContent - Function to extract content from parsed JSON
   * @param {Function} isEndMarker - Optional function to check for end markers
   * @param {string} linePrefix - Optional line prefix (default: 'data: ')
   * @returns {StreamParser}
   */
  static custom({ extractContent, isEndMarker, linePrefix }) {
    return new StreamParser({
      extractContent,
      isEndMarker: isEndMarker || (() => false),
      linePrefix: linePrefix || 'data: ',
    });
  }
}

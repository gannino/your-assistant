/**
 * StreamParser - Unified streaming response parser for OpenAI-compatible APIs
 *
 * This utility handles Server-Sent Events (SSE) streaming responses from
 * AI providers that use OpenAI-compatible format (Zai, MLX, Ollama, etc.)
 *
 * Features:
 * - Buffer management for incomplete chunks
 * - Line-by-line parsing
 * - JSON parsing with error handling
 * - [DONE] marker detection
 * - Content extraction from delta chunks
 */

/**
 * Parse OpenAI-compatible streaming chunk
 *
 * @param {string} chunk - Raw chunk from streaming response
 * @param {Object} buffer - Buffer object with streamBuffer property
 * @param {string} providerName - Provider name for logging
 * @returns {string} Extracted content from this chunk
 */
export function parseOpenAICompatibleStream(chunk, buffer, providerName = 'Provider') {
  // Initialize buffer if not exists
  if (!buffer.streamBuffer) {
    buffer.streamBuffer = '';
  }

  // Add new chunk to buffer
  buffer.streamBuffer += chunk;

  let content = '';

  // Process all complete SSE events (events are separated by \n\n)
  while (buffer.streamBuffer.includes('\n\n')) {
    const splitIndex = buffer.streamBuffer.indexOf('\n\n');
    const event = buffer.streamBuffer.substring(0, splitIndex);
    buffer.streamBuffer = buffer.streamBuffer.substring(splitIndex + 2);

    // Process the complete event
    const eventContent = parseEvent(event, providerName);
    content += eventContent;
  }

  // Handle remaining buffer (check for [DONE] marker or keep for next time)
  const lines = buffer.streamBuffer.split('\n');

  // Check if we have a [DONE] marker in the remaining lines
  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();

    if (trimmedLine.startsWith('data:')) {
      // Handle both 'data:' and 'data: ' formats
      const data = trimmedLine.startsWith('data: ') ? trimmedLine.slice(6) : trimmedLine.slice(5);

      if (data === '[DONE]') {
        console.log(`[${providerName} Parser] Found [DONE] marker`);
        // Process all lines before [DONE] as an event
        const eventBeforeDone = lines.slice(0, i).join('\n');
        const contentBeforeDone = parseEvent(eventBeforeDone, providerName);
        content += contentBeforeDone;

        // Clear everything including [DONE] line
        buffer.streamBuffer = '';
        return content;
      }
    }
  }

  // Keep remaining buffer for next time (it doesn't have \n\n, so it's incomplete)
  // But we need to rejoin with \n to preserve structure
  buffer.streamBuffer = lines.join('\n');

  return content;
}

/**
 * Parse a single SSE event
 * @param {string} event - Event string (without trailing \n\n)
 * @param {string} providerName - Provider name for logging
 * @returns {string} Extracted content
 */
function parseEvent(event, providerName) {
  let content = '';
  const lines = event.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine.startsWith('data:')) {
      continue;
    }

    // Handle both 'data:' and 'data: ' formats
    const data = trimmedLine.startsWith('data: ') ? trimmedLine.slice(6) : trimmedLine.slice(5);

    if (data === '[DONE]') {
      console.log(`[${providerName} Parser] Found [DONE] marker in event`);
      continue;
    }

    try {
      const parsed = JSON.parse(data);
      const delta = parsed.choices?.[0]?.delta;
      if (delta?.content) {
        content += delta.content;
        console.log(`[${providerName} Parser] Extracted:`, delta.content.length, 'chars');
      }
    } catch (e) {
      console.warn(`[${providerName} Parser] Failed to parse JSON:`, e.message);
    }
  }

  return content;
}

/**
 * Reset stream buffer
 *
 * @param {Object} buffer - Buffer object with streamBuffer property
 */
export function resetStreamBuffer(buffer) {
  buffer.streamBuffer = '';
}

/**
 * Create a new buffer object
 *
 * @returns {Object} Buffer object with streamBuffer property
 */
export function createStreamBuffer() {
  return { streamBuffer: '' };
}

export default {
  parseOpenAICompatibleStream,
  resetStreamBuffer,
  createStreamBuffer,
};

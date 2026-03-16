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

  const lines = buffer.streamBuffer.split('\n');
  let content = '';
  let completeLines = [];

  console.log(`[${providerName} Parser] Lines in buffer:`, lines.length);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and non-data lines
    if (!line || !line.startsWith('data: ')) {
      continue;
    }

    const data = line.slice(6); // Remove 'data: ' prefix

    // Check for stream end
    if (data === '[DONE]') {
      console.log(`[${providerName} Parser] Found [DONE] marker`);
      continue;
    }

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(data);
      const delta = parsed.choices?.[0]?.delta;
      if (delta?.content) {
        content += delta.content;
        console.log(`[${providerName} Parser] Extracted:`, delta.content.length, 'chars');
      }
      // Successfully parsed, so this line is complete
      completeLines.push(i);
    } catch (e) {
      // JSON parse error - likely incomplete chunk
      console.log(
        `[${providerName} Parser] Incomplete JSON, keeping in buffer:`,
        data.substring(0, 50) + '...'
      );
      // Keep this line in buffer for next chunk
      // Don't add to completeLines
    }
  }

  console.log(
    `[${providerName} Parser] Complete lines:`,
    completeLines.length,
    'Content extracted:',
    content.length
  );

  // Remove complete lines from buffer (in reverse order to maintain indices)
  for (let i = completeLines.length - 1; i >= 0; i--) {
    lines.splice(completeLines[i], 1);
  }

  // Join remaining lines (incomplete or buffered lines)
  buffer.streamBuffer = lines.join('\n');

  // Trim trailing newlines if no incomplete content remains
  if (buffer.streamBuffer && !buffer.streamBuffer.trim()) {
    buffer.streamBuffer = '';
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

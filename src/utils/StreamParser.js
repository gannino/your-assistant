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

  // First, try to split by double newline to find complete SSE events
  let tempBuffer = buffer.streamBuffer;
  let content = '';

  // Keep processing until we don't have any more \n\n separators
  while (tempBuffer.includes('\n\n')) {
    const splitIndex = tempBuffer.indexOf('\n\n');
    const event = tempBuffer.substring(0, splitIndex);
    const remaining = tempBuffer.substring(splitIndex + 2);

    // Process the complete event
    const eventContent = parseEvent(event, providerName);
    content += eventContent;

    // Move to next part
    tempBuffer = remaining;
  }

  // Now check if the remaining buffer has a [DONE] marker
  // which should also act as a terminator
  const lines = tempBuffer.split('\n');
  let processedUntil = 0;
  let foundDone = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();

    if (!trimmedLine.startsWith('data: ')) {
      continue;
    }

    const data = trimmedLine.slice(6);

    if (data === '[DONE]') {
      console.log(`[${providerName} Parser] Found [DONE] marker`);
      foundDone = true;
      processedUntil = i + 1;
      break;
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
      processedUntil = i + 1;
    } catch (e) {
      // JSON parse error - incomplete chunk, stop here
      console.log(`[${providerName} Parser] Incomplete JSON at line ${i}`);
      break;
    }
  }

  // Reconstruct buffer with remaining lines
  if (foundDone) {
    // Keep everything after the [DONE] marker
    buffer.streamBuffer = lines.slice(processedUntil).join('\n');
  } else if (processedUntil > 0) {
    // Keep unprocessed lines
    buffer.streamBuffer = lines.slice(processedUntil).join('\n');
  } else {
    // Keep everything in tempBuffer (which has no \n\n)
    buffer.streamBuffer = tempBuffer;
  }

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

    if (!trimmedLine.startsWith('data: ')) {
      continue;
    }

    const data = trimmedLine.slice(6);

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

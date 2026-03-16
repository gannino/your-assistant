/**
 * Retry Utility with Exponential Backoff
 *
 * Provides configurable retry logic with exponential backoff for API requests.
 * Ideal for handling rate limits (HTTP 429) and transient network failures.
 */

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    429, // Rate limit
    500, // Internal server error
    502, // Bad gateway
    503, // Service unavailable
    504, // Gateway timeout
  ],
  retryableErrorNames: [
    'AbortError', // Timeout
    'TypeError', // Network error (e.g., ECONNREFUSED)
  ],
};

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 * @param {number} attempt - Attempt number (0-indexed)
 * @param {Object} config - Retry configuration
 * @returns {number} Delay in milliseconds
 */
function calculateDelay(attempt, config) {
  // Exponential backoff: initialDelay * (multiplier ^ attempt)
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);

  // Add random jitter (±25%) to prevent thundering herd
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);

  // Cap at max delay
  return Math.min(exponentialDelay + jitter, config.maxDelayMs);
}

/**
 * Check if an error is retryable
 * @param {Error} error - Error to check
 * @param {Object} config - Retry configuration
 * @returns {boolean} True if error is retryable
 */
function isRetryableError(error, config) {
  // Check HTTP status code
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    return config.retryableErrors.includes(status);
  }

  // Check error name/type
  return config.retryableErrorNames.some(
    name =>
      error.name === name ||
      error.constructor?.name === name ||
      (error.message && error.message.includes('ECONN'))
  );
}

/**
 * Execute a function with retry logic and exponential backoff
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Retry configuration
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.initialDelayMs - Initial delay in milliseconds (default: 1000)
 * @param {number} options.maxDelayMs - Maximum delay in milliseconds (default: 30000)
 * @param {number} options.backoffMultiplier - Backoff multiplier (default: 2)
 * @param {Array<number>} options.retryableErrors - HTTP status codes to retry (default: [429, 500, 502, 503, 504])
 * @param {Array<string>} options.retryableErrorNames - Error names to retry (default: ['AbortError', 'TypeError'])
 * @param {Function} options.onRetry - Callback called before each retry (attempt, error, delayMs)
 * @param {string} options.context - Context for logging (e.g., provider name)
 * @returns {Promise<*>} Result of the function
 * @throws {Error} Last error if all retries fail
 */
export async function withRetry(fn, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  const context = config.context || 'Retry';

  let lastError;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Execute the function
      const result = await fn();

      // Log success on retry
      if (attempt > 0) {
        console.log(`[${context}] ✅ Success on attempt ${attempt + 1}`);
      }

      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt < config.maxRetries && isRetryableError(error, config)) {
        const delay = calculateDelay(attempt, config);
        const delaySeconds = (delay / 1000).toFixed(1);

        console.warn(
          `[${context}] ⚠️ Attempt ${attempt + 1}/${config.maxRetries + 1} failed: ${error.message}`
        );
        console.warn(`[${context}] ⏳ Retrying in ${delaySeconds}s...`);

        // Call onRetry callback if provided
        if (config.onRetry) {
          config.onRetry(attempt + 1, error, delay);
        }

        // Wait before retrying
        await sleep(delay);
      } else {
        // Not retryable or no more attempts
        if (!isRetryableError(error, config)) {
          console.error(`[${context}] ❌ Non-retryable error: ${error.message}`);
        } else if (attempt >= config.maxRetries) {
          console.error(`[${context}] ❌ Max retries (${config.maxRetries}) exceeded`);
        }
        throw error;
      }
    }
  }

  // Should never reach here, but just in case
  throw lastError;
}

/**
 * Create a retry wrapper with pre-configured options
 * @param {Object} options - Retry configuration (same as withRetry)
 * @returns {Function} Wrapper function that takes a function to execute
 */
export function createRetryWrapper(options = {}) {
  return (fn, fnOptions = {}) => withRetry(fn, { ...options, ...fnOptions });
}

/**
 * Specific retry configurations for common scenarios
 */
export const RetryPresets = {
  /**
   * Aggressive retry for rate-limited APIs
   * More retries, shorter initial delay
   */
  rateLimit: {
    maxRetries: 5,
    initialDelayMs: 2000,
    maxDelayMs: 60000, // 1 minute
    backoffMultiplier: 2,
    retryableErrors: [429],
  },

  /**
   * Conservative retry for server errors
   * Fewer retries, longer delay
   */
  serverError: {
    maxRetries: 2,
    initialDelayMs: 3000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryableErrors: [500, 502, 503, 504],
  },

  /**
   * Network retry for transient failures
   * Moderate retries, moderate delay
   */
  network: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 20000,
    backoffMultiplier: 2,
    retryableErrorNames: ['AbortError', 'TypeError', 'ECONNREFUSED', 'ENOTFOUND'],
  },

  /**
   * Quick retry for idempotent operations
   * Fast retries, short max delay
   */
  quick: {
    maxRetries: 3,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 1.5,
  },
};

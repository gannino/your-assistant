/**
 * BaseAIProvider - Abstract base class for all AI providers
 *
 * All AI providers must extend this class and implement the required methods.
 * This provides a consistent interface for the application to interact with
 * different AI services (OpenAI, Z.ai, Ollama, MLX, Anthropic, etc.)
 */
export class BaseAIProvider {
  constructor(config = {}) {
    if (new.target === BaseAIProvider) {
      throw new Error('BaseAIProvider is abstract and cannot be instantiated directly');
    }
    this.config = config;
    this.initialized = false;

    // Retry configuration
    this.maxRetries = 3;
    this.initialRetryDelay = 1000; // 1 second
    this.maxRetryDelay = 10000; // 10 seconds
    this.retryBackoffMultiplier = 2;
  }

  /**
   * Initialize the provider with configuration
   * @param {Object} config - Provider-specific configuration
   */
  async initialize(config) {
    this.config = config;
    this.initialized = true;
  }

  /**
   * Generate a completion from a prompt (non-streaming)
   * @param {string} prompt - The input prompt
   * @param {Object} options - Additional options
   * @returns {Promise<string>} The generated completion
   */
  async generateCompletion() {
    throw new Error('generateCompletion must be implemented by subclass');
  }

  /**
   * Generate a streaming completion
   * @param {string} prompt - The input prompt
   * @param {Function} onChunk - Callback function for each chunk (receives text string)
   * @param {Object} options - Additional options
   * @returns {Promise<void>}
   */
  async generateCompletionStream() {
    throw new Error('generateCompletionStream must be implemented by subclass');
  }

  /**
   * Validate the provider's configuration
   * @returns {Promise<Object>} Validation result with valid boolean and errors array
   */
  async validateConfig() {
    return { valid: true, errors: [] };
  }

  /**
   * Get available models for this provider
   * @returns {Promise<Array<string>>} Array of model names
   */
  async getAvailableModels() {
    return [];
  }

  /**
   * Get provider metadata
   * @returns {Object} Provider information
   */
  getProviderInfo() {
    return {
      id: this.constructor.name.toLowerCase().replace('provider', ''),
      name: 'Base Provider',
      description: 'Base AI Provider',
      supportsStreaming: true,
      requiresApiKey: true,
      requiresLocalServer: false,
      defaultModels: [],
    };
  }

  /**
   * Check if provider is ready to use
   * @returns {boolean} True if provider is initialized and configured
   */
  isReady() {
    return this.initialized;
  }

  /**
   * Execute a function with retry logic and exponential backoff
   * @param {Function} fn - Async function to execute
   * @param {Object} options - Retry options
   * @returns {Promise<*>} Result of the function
   */
  async executeWithRetry(fn, options = {}) {
    const {
      maxRetries = this.maxRetries,
      initialDelay = this.initialRetryDelay,
      maxDelay = this.maxRetryDelay,
      backoffMultiplier = this.retryBackoffMultiplier,
      onRetry = null, // Callback for retry attempts
    } = options;

    let lastError;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry if this is the last attempt or error is not retryable
        if (attempt === maxRetries || !this.isRetryableError(error)) {
          throw error;
        }

        // Log retry attempt
        console.warn(
          `[${this.getProviderInfo().name}] Request failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}. Retrying in ${delay}ms...`
        );

        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt + 1, error, delay);
        }

        // Wait before retry
        await this.sleep(delay);

        // Calculate next delay with exponential backoff
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * Check if an error is retryable
   * @param {Error} error - The error to check
   * @returns {boolean} True if the error is retryable
   */
  isRetryableError(error) {
    // Network errors
    if (
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network error') ||
      error.message.includes('ECONNRESET') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ENOTFOUND')
    ) {
      return true;
    }

    // HTTP status codes that are retryable
    if (
      error.message.includes('429') || // Rate limit
      error.message.includes('503') || // Service unavailable
      error.message.includes('502') || // Bad gateway
      error.message.includes('504')
    ) {
      // Gateway timeout
      return true;
    }

    return false;
  }

  /**
   * Sleep for a specified duration
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test connection to the provider
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    try {
      await this.validateConfig();
      return {
        success: true,
        message: 'Connection successful',
        provider: this.getProviderInfo().id,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        provider: this.getProviderInfo().id,
      };
    }
  }

  /**
   * Execute a function with timeout
   * @param {Function} fn - Async function to execute
   * @param {number} timeoutMs - Timeout in milliseconds
   * @param {string} errorMessage - Custom error message
   * @returns {Promise<*>} Result of the function
   */
  async executeWithTimeout(fn, timeoutMs = 30000, errorMessage = 'Operation timed out') {
    return Promise.race([
      fn(),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(errorMessage));
        }, timeoutMs);
      }),
    ]);
  }

  /**
   * Create an abort controller with timeout
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Object} AbortController and cleanup function
   */
  createTimeoutController(timeoutMs = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timeoutId);
    };

    return { controller, cleanup };
  }
}

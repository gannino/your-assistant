/**
 * AI Provider Error Handler
 *
 * Standardized error handling across all AI providers.
 * Provides consistent error codes, messages, and user-friendly feedback.
 */

/**
 * Standard error codes for AI providers
 */
export const ErrorCodes = {
  API_KEY_INVALID: 'API_KEY_INVALID',
  API_KEY_MISSING: 'API_KEY_MISSING',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  MODEL_NOT_AVAILABLE: 'MODEL_NOT_AVAILABLE',
  MODEL_MISSING: 'MODEL_MISSING',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  INVALID_REQUEST: 'INVALID_REQUEST',
  SERVER_ERROR: 'SERVER_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONTEXT_TOO_LONG: 'CONTEXT_TOO_LONG',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  INITIALIZATION_FAILED: 'INITIALIZATION_FAILED',
  NOT_INITIALIZED: 'NOT_INITIALIZED',
};

/**
 * User-friendly error messages
 */
export const ErrorMessages = {
  [ErrorCodes.API_KEY_INVALID]:
    'The API key you provided is invalid. Please check your API key and try again.',
  [ErrorCodes.API_KEY_MISSING]: 'No API key provided. Please configure your API key in settings.',
  [ErrorCodes.RATE_LIMIT_EXCEEDED]:
    'You have exceeded the rate limit. Please wait a moment and try again.',
  [ErrorCodes.MODEL_NOT_AVAILABLE]:
    'The requested model is not available. Please select a different model.',
  [ErrorCodes.MODEL_MISSING]: 'No model specified. Please select a model in settings.',
  [ErrorCodes.NETWORK_ERROR]:
    'Network error occurred. Please check your internet connection and try again.',
  [ErrorCodes.TIMEOUT]: 'The request timed out. Please try again.',
  [ErrorCodes.INVALID_REQUEST]: 'Invalid request. Please check your input and try again.',
  [ErrorCodes.SERVER_ERROR]: 'The AI service is experiencing issues. Please try again later.',
  [ErrorCodes.UNAUTHORIZED]: 'Authentication failed. Please check your API key.',
  [ErrorCodes.FORBIDDEN]: 'You do not have permission to access this resource.',
  [ErrorCodes.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCodes.CONTEXT_TOO_LONG]: 'Your input is too long. Please shorten it and try again.',
  [ErrorCodes.INVALID_RESPONSE]: 'Received an invalid response from the AI service.',
  [ErrorCodes.PROVIDER_ERROR]: 'An error occurred with the AI provider.',
  [ErrorCodes.INITIALIZATION_FAILED]: 'Failed to initialize the AI provider.',
  [ErrorCodes.NOT_INITIALIZED]: 'The AI provider is not initialized.',
};

/**
 * Custom error class for AI provider errors
 */
export class AIProviderError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} provider - Provider name (e.g., 'OpenAI', 'Anthropic')
   * @param {string} code - Error code from ErrorCodes
   * @param {Object} details - Additional error details
   */
  constructor(message, provider, code, details = {}) {
    super(message);
    this.name = 'AIProviderError';
    this.provider = provider;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Get user-friendly error message
   * @returns {string} User-friendly message
   */
  getUserMessage() {
    return ErrorMessages[this.code] || this.message;
  }

  /**
   * Get error details as plain object
   * @returns {Object} Error details
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      provider: this.provider,
      code: this.code,
      userMessage: this.getUserMessage(),
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Handle provider-specific errors and convert to standardized format
 * @param {Error} error - Original error from provider
 * @param {string} providerName - Name of the provider
 * @returns {AIProviderError} Standardized error
 */
export function handleProviderError(error, providerName) {
  // If already an AIProviderError, return as-is
  if (error instanceof AIProviderError) {
    return error;
  }

  // Extract error code and message from provider-specific errors
  let code = ErrorCodes.PROVIDER_ERROR;
  let message = error.message;
  let details = {};

  // OpenAI SDK errors
  if (error.constructor?.name === 'APIError' || error.status) {
    const status = error.status || error.code;

    switch (status) {
      case 401:
        code = ErrorCodes.API_KEY_INVALID;
        break;
      case 429:
        code = ErrorCodes.RATE_LIMIT_EXCEEDED;
        break;
      case 404:
        code = ErrorCodes.MODEL_NOT_AVAILABLE;
        break;
      case 400:
        code = ErrorCodes.INVALID_REQUEST;
        break;
      case 500:
      case 502:
      case 503:
        code = ErrorCodes.SERVER_ERROR;
        break;
      default:
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          code = ErrorCodes.NETWORK_ERROR;
        } else if (error.type === 'request_timeout' || error.type === 'timeout') {
          code = ErrorCodes.TIMEOUT;
        }
    }

    details = {
      status: error.status,
      type: error.type,
      originalCode: error.code,
    };
  }

  // Anthropic SDK errors
  else if (error.constructor?.name === 'AnthropicError' || error.status) {
    const status = error.status;

    switch (status) {
      case 401:
        code = ErrorCodes.UNAUTHORIZED;
        break;
      case 429:
        code = ErrorCodes.RATE_LIMIT_EXCEEDED;
        break;
      case 400:
        if (error.message?.includes('context_length_exceeded')) {
          code = ErrorCodes.CONTEXT_TOO_LONG;
        } else {
          code = ErrorCodes.INVALID_REQUEST;
        }
        break;
      case 500:
      case 502:
      case 503:
        code = ErrorCodes.SERVER_ERROR;
        break;
      default:
        code = ErrorCodes.PROVIDER_ERROR;
    }

    details = {
      status: error.status,
      type: error.error?.type,
    };
  }

  // Network errors
  else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    code = ErrorCodes.NETWORK_ERROR;
    message = `Could not connect to ${providerName} server. Please check your internet connection.`;
  } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
    code = ErrorCodes.TIMEOUT;
    message = `Connection to ${providerName} server timed out.`;
  }

  return new AIProviderError(message, providerName, code, details);
}

/**
 * Create an error for missing API key
 * @param {string} providerName - Name of the provider
 * @returns {AIProviderError} Error object
 */
export function createMissingApiKeyError(providerName) {
  return new AIProviderError(
    `No API key provided for ${providerName}`,
    providerName,
    ErrorCodes.API_KEY_MISSING
  );
}

/**
 * Create an error for invalid API key
 * @param {string} providerName - Name of the provider
 * @returns {AIProviderError} Error object
 */
export function createInvalidApiKeyError(providerName) {
  return new AIProviderError(
    `Invalid API key for ${providerName}`,
    providerName,
    ErrorCodes.API_KEY_INVALID
  );
}

/**
 * Create an error for provider not initialized
 * @param {string} providerName - Name of the provider
 * @returns {AIProviderError} Error object
 */
export function createNotInitializedError(providerName) {
  return new AIProviderError(
    `${providerName} provider is not initialized`,
    providerName,
    ErrorCodes.NOT_INITIALIZED
  );
}

/**
 * Create an error for initialization failure
 * @param {string} providerName - Name of the provider
 * @param {Error} originalError - Original error that caused failure
 * @returns {AIProviderError} Error object
 */
export function createInitializationError(providerName, originalError) {
  return new AIProviderError(
    `Failed to initialize ${providerName} provider: ${originalError.message}`,
    providerName,
    ErrorCodes.INITIALIZATION_FAILED,
    { originalError: originalError.message }
  );
}

/**
 * Validate provider configuration
 * @param {Object} config - Provider configuration
 * @param {string} providerName - Name of the provider
 * @throws {AIProviderError} If configuration is invalid
 */
export function validateProviderConfig(config, providerName) {
  if (!config) {
    throw new AIProviderError(
      `No configuration provided for ${providerName}`,
      providerName,
      ErrorCodes.INITIALIZATION_FAILED
    );
  }

  if (!config.apiKey) {
    throw createMissingApiKeyError(providerName);
  }

  if (!config.model) {
    throw new AIProviderError(
      `No model specified for ${providerName}`,
      providerName,
      ErrorCodes.MODEL_MISSING
    );
  }
}

export default {
  ErrorCodes,
  ErrorMessages,
  AIProviderError,
  handleProviderError,
  createMissingApiKeyError,
  createInvalidApiKeyError,
  createNotInitializedError,
  createInitializationError,
  validateProviderConfig,
};

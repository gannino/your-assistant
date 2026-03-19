/**
 * API Error Handler Utility
 *
 * Standardized error handling for AI provider API requests.
 * Provides consistent, user-friendly error messages with actionable guidance.
 */

/**
 * Handle HTTP errors with standardized messages
 * @param {Response} response - Fetch response object
 * @param {string} providerName - Provider identifier (e.g., 'Anthropic', 'Gemini')
 * @param {Object} options - Error handling options
 * @param {Array<string>} options.fallbackModels - Fallback model list to return on error
 * @param {string} options.apiKeyUrl - URL where user can get/update API key
 * @param {string} options.docsUrl - Documentation URL for more help
 * @returns {Promise<Array<string>>} Fallback models or empty array
 */
export async function handleHttpError(
  response,
  providerName,
  { fallbackModels = [], apiKeyUrl = '', docsUrl = '' } = {}
) {
  const errorText = await response.text().catch(() => '');

  switch (response.status) {
    case 401:
      console.error(`[${providerName}] ❌ Authentication failed (401)`);
      console.error(`[${providerName}] 💡 Your API key may be invalid or expired`);
      if (apiKeyUrl) {
        console.error(`[${providerName}] 💡 Check your API key at: ${apiKeyUrl}`);
      }
      return fallbackModels;

    case 403:
      console.error(`[${providerName}] ❌ Access forbidden (403)`);
      console.error(`[${providerName}] 💡 Your API key may not have access to this endpoint`);
      if (apiKeyUrl) {
        console.error(`[${providerName}] 💡 Verify your API key permissions at: ${apiKeyUrl}`);
      }
      return fallbackModels;

    case 429: {
      const waitMinutes = Math.ceil((5 * 60 * 1000) / 60000);
      console.warn(`[${providerName}] ⚠️ Rate limited by API (429)`);
      console.warn(
        `[${providerName}] 💡 Tip: Models are cached for 5 minutes to avoid rate limits`
      );
      console.warn(`[${providerName}] 💡 Please wait ${waitMinutes} minutes before trying again`);
      if (fallbackModels.length > 0) {
        console.warn(
          `[${providerName}] 💡 Using cached model list as fallback (${fallbackModels.length} models)`
        );
      }
      return fallbackModels;
    }

    case 500:
    case 502:
    case 503:
      console.error(
        `[${providerName}] ❌ Server error (${response.status}) - ${providerName} API is experiencing issues`
      );
      console.error(`[${providerName}] 💡 Try again in a few moments`);
      if (docsUrl) {
        console.error(`[${providerName}] 💡 Check status at: ${docsUrl}`);
      }
      if (fallbackModels.length > 0) {
        console.error(
          `[${providerName}] 💡 Using fallback model list in the meantime (${fallbackModels.length} models)`
        );
      }
      return fallbackModels;

    default:
      console.error(
        `[${providerName}] ❌ API error (${response.status}): ${errorText || 'Unknown error'}`
      );
      console.error(`[${providerName}] 💡 Falling back to hardcoded model list`);
      return fallbackModels;
  }
}

/**
 * Handle network/fetch errors with standardized messages
 * @param {Error} error - Error object
 * @param {string} providerName - Provider identifier
 * @param {string} operation - Description of what was being attempted
 * @returns {void}
 */
export function handleNetworkError(error, providerName, operation = 'API request') {
  const errorMsg = error.name === 'AbortError' ? 'Request timeout' : error.message;
  console.error(`[${providerName}] ❌ ${operation} failed: ${errorMsg}`);

  if (error.name === 'AbortError') {
    console.error(`[${providerName}] 💡 The request took too long. Try again later.`);
  } else if (error.message.includes('fetch')) {
    console.error(`[${providerName}] 💡 Check your internet connection`);
  } else {
    console.error(`[${providerName}] 💡 ${error.message}`);
  }
}

/**
 * Log successful API operation
 * @param {string} providerName - Provider identifier
 * @param {string} operation - Description of what succeeded
 * @param {number} count - Number of items (e.g., models fetched)
 * @returns {void}
 */
export function logSuccess(providerName, operation, count = 0) {
  if (count > 0) {
    console.log(`[${providerName}] ✅ ${operation} (${count} items)`);
  } else {
    console.log(`[${providerName}] ✅ ${operation}`);
  }
}

/**
 * Create a standardized error object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Error} Error object with metadata
 */
export function createProviderError(message, code = 'PROVIDER_ERROR', details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Validate and throw if provider is not initialized
 * @param {boolean} initialized - Whether provider is initialized
 * @param {string} providerName - Provider identifier
 * @throws {Error} If provider is not initialized
 * @returns {void}
 */
export function requireInitialized(initialized, providerName) {
  if (!initialized) {
    throw new Error(`${providerName} provider not initialized. Call initialize() first.`);
  }
}

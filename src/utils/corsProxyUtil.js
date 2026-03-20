/**
 * CORS Proxy Utility for API Requests
 *
 * Provides CORS proxy support for API requests that don't support browser-based requests.
 * Uses the same proxy infrastructure as website fetching.
 */

// CORS proxies (same order as website_util.js)
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

/**
 * Fetch through CORS proxy with fallback
 * @param {string} url - Target URL
 * @param {Object} options - Fetch options
 * @param {Object} options.headers - Request headers
 * @param {string} options.method - HTTP method
 * @param {string} options.body - Request body
 * @returns {Promise<Response>} Fetch response
 */
export async function fetchWithCorsProxy(url, options = {}) {
  let lastError = null;
  let attemptCount = 0;
  const maxAttempts = CORS_PROXIES.length;

  // Try each CORS proxy
  for (const proxy of CORS_PROXIES) {
    attemptCount++;

    try {
      console.log(`[CORS Proxy] (${attemptCount}/${maxAttempts}) Trying proxy: ${proxy}`);
      console.log(`[CORS Proxy] Target URL: ${url}`);

      const proxiedUrl = proxy + encodeURIComponent(url);

      // Set timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      // Prepare headers - some proxies don't pass all headers
      const headers = options.headers || {};

      // Make request through proxy
      const response = await fetch(proxiedUrl, {
        ...options,
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      console.log(`[CORS Proxy] Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[CORS Proxy] ✅ Success with proxy: ${proxy}`);
      return response;
    } catch (error) {
      const errorMsg = error.name === 'AbortError' ? 'Request timeout' : error.message;
      console.error(`[CORS Proxy] ❌ Proxy ${proxy} failed: ${errorMsg}`);
      lastError = error;

      // Continue to next proxy
    }
  }

  // All proxies failed
  const finalError = lastError?.message || 'Unknown error';
  console.error(`[CORS Proxy] All proxies failed. Last error: ${finalError}`);

  throw new Error(
    `Failed to fetch through CORS proxies after ${maxAttempts} attempts. Last error: ${finalError}`
  );
}

/**
 * Check if a request needs CORS proxy (for API requests)
 * @param {string} url - Target URL
 * @returns {boolean} True if CORS proxy is needed
 */
export function needsCorsProxy(url) {
  try {
    const urlObj = new URL(url);

    // Same origin - no proxy needed
    if (urlObj.origin === window.location.origin) {
      return false;
    }

    // Check if the URL might have CORS issues
    // Common APIs that don't support browser CORS:
    const corsRestrictedDomains = [
      'api.anthropic.com',
      'generativelanguage.googleapis.com',
      'api.openai.com',
    ];

    return corsRestrictedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return true; // Safe default
  }
}

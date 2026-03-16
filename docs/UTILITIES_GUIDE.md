# AI Provider Utilities Guide

This document describes the shared utilities used across all AI providers for consistent error handling, caching, and retry logic.

## Overview

The following utilities provide a unified approach to common operations across all AI providers:

- **[modelCacheUtil.js](../src/utils/modelCacheUtil.js)** - Model list caching to prevent rate limiting
- **[apiErrorHandler.js](../src/utils/apiErrorHandler.js)** - Standardized HTTP error handling
- **[retryUtil.js](../src/utils/retryUtil.js)** - Exponential backoff with jitter for retries

## Model Cache Utility

**Purpose:** Prevents HTTP 429 rate limit errors when frequently fetching model lists.

**Features:**
- 5-minute default cache duration
- Shared in-memory cache across provider instances
- Automatic cache expiration
- Cache statistics for debugging

**Usage:**
```javascript
import { getCachedModels, setCachedModels } from '@/utils/modelCacheUtil';

async getAvailableModels() {
  // Check cache first
  const cached = getCachedModels('anthropic');
  if (cached) return cached;

  // Fetch from API
  const models = await this.fetchModelsFromAPI();

  // Cache for next time
  setCachedModels('anthropic', models);
  return models;
}
```

**API:**
- `getCachedModels(providerName, cacheDuration)` - Get cached models or null if expired
- `setCachedModels(providerName, models)` - Cache model list with timestamp
- `clearProviderCache(providerName)` - Clear specific provider cache
- `clearAllCache()` - Clear all cached models
- `getCacheStats()` - Get cache statistics for debugging

## API Error Handler Utility

**Purpose:** Provides consistent, user-friendly error messages with actionable guidance.

**Features:**
- Standardized HTTP error handling (401, 403, 429, 500+)
- Emoji indicators (❌ errors, ⚠️ warnings, 💡 tips, ✅ success)
- Actionable tips for each error type
- Fallback to hardcoded models when API fails

**Usage:**
```javascript
import { handleHttpError, handleNetworkError, logSuccess } from '@/utils/apiErrorHandler';

const response = await fetch(url);
if (!response.ok) {
  const fallbackModels = await handleHttpError(response, 'Anthropic', {
    fallbackModels: ['claude-sonnet-4-6', 'claude-opus-4-6'],
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    docsUrl: 'https://docs.anthropic.com',
  });
  return fallbackModels;
}

logSuccess('Anthropic', 'Fetched models', models.length);
```

**Error Messages:**
- **401**: "Authentication failed" + API key link
- **403**: "Access forbidden" + permissions check
- **429**: "Rate limited" + cache duration explanation
- **500/502/503**: "Server error" + retry suggestion
- **Network errors**: Timeout/connection guidance

**API:**
- `handleHttpError(response, providerName, options)` - Handle HTTP errors with fallbacks
- `handleNetworkError(error, providerName, operation)` - Handle network errors
- `logSuccess(providerName, operation, count)` - Log successful operation
- `createProviderError(message, code, details)` - Create standardized error object
- `requireInitialized(initialized, providerName)` - Validate provider initialization

## Retry Utility

**Purpose:** Execute functions with exponential backoff and jitter for retry logic.

**Features:**
- Configurable retry attempts (default: 3)
- Exponential backoff with random jitter (±25%)
- Intelligent error detection (HTTP status + error types)
- Preset configurations for common scenarios
- Progress logging with context

**Usage:**
```javascript
import { withRetry, RetryPresets } from '@/utils/retryUtil';

// Basic usage
const result = await withRetry(
  async () => await this.client.completions.create(params),
  { context: 'Anthropic' }
);

// With preset for rate-limited APIs
const result = await withRetry(
  async () => await this.client.completions.create(params),
  { ...RetryPresets.rateLimit, context: 'Anthropic' }
);

// Via BaseAIProvider
const result = await this.executeWithRetry(
  async () => await this.client.completions.create(params),
  { maxRetries: 5 }
);

// With preset
const result = await this.executeWithRetryPreset(
  async () => await this.client.completions.create(params),
  'rateLimit'
);
```

**Retry Presets:**
- **`rateLimit`** - Aggressive retry for 429 errors (5 retries, 2s initial, 60s max)
- **`serverError`** - Conservative retry for 500+ errors (2 retries, 3s initial)
- **`network`** - Moderate retry for transient failures (3 retries, 1s initial)
- **`quick`** - Fast retries for idempotent operations (3 retries, 500ms initial)

**API:**
- `withRetry(fn, options)` - Execute function with retry logic
- `createRetryWrapper(options)` - Create pre-configured retry wrapper
- `RetryPresets` - Predefined retry configurations

**Configuration Options:**
- `maxRetries` - Maximum retry attempts (default: 3)
- `initialDelayMs` - Initial delay in milliseconds (default: 1000)
- `maxDelayMs` - Maximum delay cap (default: 30000)
- `backoffMultiplier` - Exponential backoff factor (default: 2)
- `retryableErrors` - HTTP status codes to retry (default: [429, 500, 502, 503, 504])
- `retryableErrorNames` - Error types to retry (default: ['AbortError', 'TypeError'])
- `onRetry` - Callback before each retry (attempt, error, delayMs)
- `context` - Provider name for logging

## Integration Examples

### Example 1: AnthropicProvider

```javascript
import { getCachedModels, setCachedModels } from '@/utils/modelCacheUtil';
import { handleHttpError, handleNetworkError, logSuccess } from '@/utils/apiErrorHandler';
import { withRetry, RetryPresets } from '@/utils/retryUtil';

async getAvailableModels() {
  // Check cache
  const cached = getCachedModels('anthropic');
  if (cached) return cached;

  // Try direct fetch with retry
  try {
    const response = await withRetry(
      async () => await fetch('https://api.anthropic.com/v1/models', {
        headers: { 'X-Api-Key': this.config.apiKey }
      }),
      { ...RetryPresets.rateLimit, context: 'Anthropic' }
    );

    if (!response.ok) {
      const fallback = await handleHttpError(response, 'Anthropic', {
        fallbackModels: ALL_MODELS,
        apiKeyUrl: 'https://console.anthropic.com/settings/keys',
      });
      setCachedModels('anthropic', fallback);
      return fallback;
    }

    const data = await response.json();
    const models = data.data.map(m => m.id);

    logSuccess('Anthropic', 'Fetched models', models.length);
    setCachedModels('anthropic', models);
    return models;

  } catch (error) {
    handleNetworkError(error, 'Anthropic', 'Fetching models');
    setCachedModels('anthropic', ALL_MODELS);
    return ALL_MODELS;
  }
}
```

### Example 2: OllamaProvider

```javascript
async generateCompletionStream(prompt, onChunk, options = {}) {
  requireInitialized(this.initialized, 'Ollama');

  try {
    const response = await this.executeWithRetryPreset(
      async () => await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.config.model, messages, stream: true })
      }),
      'network' // Use network preset for local server
    );

    if (!response.ok) {
      await handleHttpError(response, 'Ollama', {
        fallbackModels: this.getDefaultModels(),
        docsUrl: 'https://ollama.ai/docs',
      });
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const parser = StreamParser.ollama();
    await parser.parseStream(response.body, onChunk);

  } catch (error) {
    handleNetworkError(error, 'Ollama', 'Streaming request');
    throw error;
  }
}
```

## Benefits

1. **Consistency** - All providers handle errors the same way
2. **Rate Limit Protection** - Caching prevents 429 errors when switching providers
3. **User-Friendly** - Clear error messages with actionable guidance
4. **Reduced Duplication** - Shared logic instead of copy-pasted code
5. **Maintainability** - Bug fixes and improvements apply to all providers
6. **Jitter** - Random delay prevents thundering herd problem
7. **Flexibility** - Easy to configure retry strategies per scenario

## Testing

You can test these utilities in the browser console:

```javascript
// Test caching
import { getCacheStats, clearAllCache } from '@/utils/modelCacheUtil';
console.log(getCacheStats());

// Test retry logic
import { withRetry } from '@/utils/retryUtil';
let attempts = 0;
await withRetry(
  async () => {
    attempts++;
    if (attempts < 3) throw new Error('Fake error');
    return 'Success!';
  },
  { context: 'Test' }
);
```

## Migration Guide

To migrate an existing provider to use these utilities:

1. **Import utilities** at top of provider file
2. **Replace cache logic** with `getCachedModels()` / `setCachedModels()`
3. **Replace error handling** with `handleHttpError()` / `handleNetworkError()`
4. **Replace retry logic** with `this.executeWithRetry()` or `withRetry()`
5. **Add success logging** with `logSuccess()`
6. **Remove duplicate code** (old cache/error/retry implementations)

## See Also

- [BaseAIProvider.js](../src/services/ai/providers/BaseAIProvider.js) - Abstract base class
- [Provider Implementation Guide](./PROVIDER_IMPLEMENTATION_GUIDE.md) - How to create new providers
- [Error Handling Strategy](./ERROR_HANDLING_STRATEGY.md) - Detailed error handling approach

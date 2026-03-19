# OpenRouter Provider Fixes

## Issues Fixed

### 1. Models Not Displaying in Settings UI ✅

**Problem:** The browser console showed models were downloaded and cached, but the dropdown in settings was empty.

**Root Cause:** The `loadModelsForProvider` function in `AISettings.vue` was missing the `openrouter` case in the switch statement that assigns the loaded models to the reactive variable.

**Fix:** Added the missing case:
```javascript
case 'openrouter':
  openrouter_models.value = models;
  break;
```

**File:** [src/views/settings/AISettings.vue](../src/views/settings/AISettings.vue:736)

### 2. API Key Validation Error ✅

**Problem:** Provider threw an error when validating config before initialization.

**Root Cause:** The `validateConfig` method tried to access `this.config.apiKey` without checking if `this.config` existed first.

**Fix:** Added null checks:
```javascript
if (!this.config || !this.config.apiKey) {
  errors.push('API key is required');
}
// ...
if (test && this.config && this.config.apiKey && this.initialized) {
  // test API key
}
```

**File:** [src/services/ai/providers/OpenRouterProvider.js](../src/services/ai/providers/OpenRouterProvider.js:276)

## Testing

To verify the fixes:

1. **Clear cache and reload:**
   - Open browser DevTools (F12)
   - Go to Application → Local Storage
   - Clear `openrouter_api_key` if needed
   - Refresh the page

2. **Configure OpenRouter:**
   - Go to Settings → AI Provider
   - Select "OpenRouter (300+ Models)"
   - Enter API key (starts with `sk-or-v1-`)
   - Click "Test Connection" to verify

3. **Verify model loading:**
   - Click "Refresh Models" button
   - Check browser console for: `[OpenRouter] ✅ Fetched X models from server`
   - Verify models appear in dropdown

4. **Test caching:**
   - Switch to a different provider
   - Switch back to OpenRouter
   - Check console for: `[OpenRouter] Using cached models (Xs old)`

## Expected Behavior

**Console logs when loading models:**
```
[OpenRouter] Attempting to fetch models from API...
[OpenRouter] ✅ Fetched 350 models from server
[OpenRouter] ✅ Cached 350 models
```

**On subsequent loads (within 5 minutes):**
```
[OpenRouter] Using cached models (45s old)
```

**If API fails:**
```
[OpenRouter] ⚠️ Rate limited by API (429)
[OpenRouter] 💡 Tip: Models are cached for 5 minutes to avoid rate limits
[OpenRouter] 💡 Using cached model list as fallback (20 models)
```

## Summary

Both issues were simple but critical:
- Missing case in switch statement (UI update)
- Missing null check in validation (error handling)

The provider should now work correctly with:
- ✅ API key validation
- ✅ Model list display
- ✅ Model caching (5-minute cache)
- ✅ Fallback to defaults on error
- ✅ User-friendly error messages

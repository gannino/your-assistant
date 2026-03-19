# Development Guidelines — Your Assistant

## Code Quality Standards

### Formatting (Prettier enforced)
- Single quotes for strings: `'hello'` not `"hello"`
- Semicolons required
- 2-space indentation
- Trailing commas in ES5 positions (objects, arrays, function params)
- Max line width: 100 characters
- Arrow functions omit parens for single params: `x => x * 2` not `(x) => x * 2`
- LF line endings

### Linting (ESLint)
- `no-console` is OFF in development — console logging is actively used for debugging
- `vue/multi-word-component-names` is OFF — single-word component names are allowed
- `prettier/prettier` is an error — formatting violations fail the lint check
- Run `npm run lint` to auto-fix, `npm run lint:check` to check only

---

## Naming Conventions

### Files
- Vue components: PascalCase (`HomeView.vue`, `SettingsLayout.vue`, `LoadingIcon.vue`)
- Composables: camelCase with `use` prefix (`useAutoMode.js`, `useElectron.js`)
- Utilities: snake_case (`config_util.js`, `pdf_util.js`, `screenshot_util.js`)
- Services: PascalCase class files (`ZaiProvider.js`, `BaseAIProvider.js`)
- Spec files: co-located with source (`config_util.spec.js`, `LoadingIcon.spec.js`)

### Variables & Functions
- camelCase for variables and functions: `triggerDelay`, `startAutoMode`, `buildUserMessage`
- SCREAMING_SNAKE_CASE for module-level constants: `MAX_SCREENSHOTS`, `AUTO_DEFAULTS`, `KEY_TRIGGER_DELAY`
- Private/internal functions (not exported) use plain camelCase without underscore prefix
- localStorage keys use snake_case strings: `'auto_trigger_delay_ms'`, `'ai_provider'`

### CSS Classes
- BEM-like kebab-case: `.homeview-container`, `.panel-header`, `.mobile-action-bar`
- State modifiers: `.is-mobile`, `.is-active`, `.is-hidden`

---

## Structural Conventions

### Vue Components (Composition API)
All components use `<script setup>` with Vue 3 Composition API. Standard section order:

```js
// 1. Imports
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { IconName } from '@element-plus/icons-vue';
import ComponentName from '@/components/ComponentName.vue';
import { composable } from '../composables/useComposable';
import util from '../utils/config_util';

// 2. Composable usage
const { isMobile } = useMobile();

// 3. Constants (SCREAMING_SNAKE_CASE)
const MAX_ITEMS = 5;
const KEY_NAME = 'storage_key';

// 4. Reactive state (ref/reactive)
const myValue = ref(null);

// 5. Computed properties
const derivedValue = computed(() => ...);

// 6. Watchers
watch(() => myValue.value, (newVal) => { ... });

// 7. Methods (JSDoc for non-trivial ones)
const myMethod = async () => { ... };

// 8. Lifecycle hooks
onMounted(() => { ... });
onUnmounted(() => { ... });
```

### Composables
- Module-level singleton state (not per-component instance) for shared state:
  ```js
  const isAutoMode = ref(false);  // module-level singleton
  export function useAutoMode() {
    return { isAutoMode, startAutoMode, stopAutoMode };
  }
  ```
- Export named functions alongside the composable hook
- Return `readonly()` refs when state should not be mutated externally
- Return cleanup functions from event registration helpers

### Service Providers (AI + Transcription)
Every provider follows this interface contract:

```js
class MyProvider extends BaseAIProvider {
  async initialize(config) { ... }           // Store config, set this.initialized = true
  async generateCompletionStream(prompt, onChunk, options = {}) { ... }
  async generateCompletion(prompt, options = {}) { ... }
  async validateConfig() { return { valid, errors }; }
  getProviderInfo() {
    return { id, name, description, supportsStreaming, requiresApiKey, ... };
  }
}
```

- Always check `this.initialized` before generating completions
- Implement non-streaming fallback when streaming fails
- `getProviderInfo()` must return an `id` field — used as registry key
- Providers registered via try/catch in `registerDefaultProviders()` to prevent one failure from blocking others

### Config Utility Pattern
All settings read/write through `config_util.js` — never access `localStorage` directly in components:

```js
// ✅ Correct
import config_util from '../utils/config_util';
const apiKey = config_util.openai_api_key();

// ❌ Avoid
const apiKey = localStorage.getItem('openai_key');
```

Each config function follows the pattern:
```js
function setting_name() {
  return localStorage.getItem('storage_key') || 'default_value';
}
```

---

## Semantic Patterns

### Logging with Prefixes
All console logs use bracketed module prefixes for easy filtering:
```js
console.log('[PDF Processing] Loaded 5 pages in 120ms');
console.log('[Z.ai] Request URL:', url);
console.warn('[AutoMode] Screenshot tick failed:', err.message);
console.error('[Transcription] Error:', error);
```
Common prefixes: `[PDF Processing]`, `[Z.ai]`, `[Z.ai Parser]`, `[AutoMode]`, `[Transcription]`, `[AI]`, `[Context]`, `[History]`, `[Mobile]`, `[Overlay]`, `[Context Prep]`

### Error Handling
- Wrap provider registration in try/catch with `console.warn` (non-fatal)
- Streaming errors: attempt reconnect up to `maxReconnectAttempts` times with exponential backoff
- Provide user-facing error messages in the UI (not just console)
- Provider-specific error messages with troubleshooting steps (see ZaiProvider)
- Fallback chains: streaming → non-streaming → truncation → simple concatenation

### Platform-Specific Branching
Mobile vs desktop differences are handled via `isMobile` from `useMobile()`:
```js
const limits = isMobile.value
  ? { maxTranscription: 10000, maxAIResponse: 30000 }
  : { maxTranscription: 15000, maxAIResponse: 50000 };
```
Browser detection in utilities uses `navigator.userAgent` regex patterns (see `pdf_util.js`).

### SSE Streaming Pattern
All AI providers parse Server-Sent Events manually:
```js
const reader = response.body.getReader();
const decoder = new TextDecoder();
let { done, value } = await reader.read();
while (!done) {
  const chunk = decoder.decode(value, { stream: true });
  const content = this.parseStreamChunk(chunk);  // handles partial JSON
  if (content) onChunk(content);
  ({ done, value } = await reader.read());
}
```
Buffer incomplete SSE lines across chunks — don't assume each `read()` contains complete JSON.

### localStorage Key Management
Keys are defined as module-level constants at the top of the file:
```js
const OPACITY_KEY     = 'appearance_opacity';
const TRIGGER_DELAY_KEY = 'auto_trigger_delay_ms';
```
Settings components read on `onMounted`, write in `onChange` handlers immediately.

### Electron IPC Bridge
Renderer accesses Electron via `window.electronAPI` (context bridge). Always guard with optional chaining:
```js
window.electronAPI?.setOpacity(val);
window.electronAPI?.onToggleMini(cb) ?? (() => {});
```
The `useElectron` composable wraps all IPC calls — use it instead of accessing `window.electronAPI` directly in components.

### JSDoc Comments
Non-trivial functions use JSDoc with `@param` and `@returns`:
```js
/**
 * Build the user message by combining the question with context and history.
 * @param {string} question - The user's question or transcription
 * @returns {Promise<string>}
 */
const buildUserMessage = async question => { ... };
```
Simple getters and one-liners do not need JSDoc.

### Section Separators in Large Files
Large files use visual section separators with `// ──` style:
```js
// ── Keys ──────────────────────────────────────────────────────────────────────
// ── State ─────────────────────────────────────────────────────────────────────
// ── Public API ────────────────────────────────────────────────────────────────
```
Or `// ============================================` style for major sections in config/utility files.

### Memory Management
- Accumulation buffers (transcript, AI response) have platform-specific max lengths
- Truncate with a user-visible message: `[Content truncated due to length...]`
- Clean up timers, watchers, and event listeners in `onUnmounted`
- Release screen capture streams explicitly via `stopScreenCapture()`
- Cancel `requestAnimationFrame` loops on unmount

### Vue Template Patterns
- Use `v-if` / `v-else` for mutually exclusive states (not `v-show` for logic)
- Use `v-show` for performance-sensitive toggles (e.g., panels that toggle frequently)
- Conditional rendering for mobile vs desktop: `v-if="isMobile"` / `v-else`
- Element Plus icons imported individually from `@element-plus/icons-vue` and used as `:icon="IconName"` prop or `<el-icon><IconName /></el-icon>`
- `<template #default="{ row }">` for table column slots

---

## Testing Patterns

- Test files co-located with source: `config_util.spec.js` next to `config_util.js`
- Use `@vue/test-utils` for component tests
- `@/` alias works in tests via Jest `moduleNameMapper`
- Coverage collected automatically on `npm test` — output to `coverage/`
- Mock `localStorage` in tests via `tests/setup.js`



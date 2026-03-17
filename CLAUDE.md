# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Project identity**: This is "Your Assistant" — a general-purpose real-time AI assistant.

## Development Commands

```bash
# Web Development
npm install              # Install dependencies
npm run serve            # Start dev server (HTTP, port 8080)
npm run serve:https      # Start dev server with HTTPS (required for some speech APIs)
npm run serve:http       # Explicitly HTTP
npm run build            # Production build
npm run generate:certs   # Generate local HTTPS certificates

# Electron Desktop App
npm run electron:dev         # Start Electron app with HTTP dev server
npm run electron:dev:https   # Start with HTTPS (required for microphone)
npm run electron:build       # Build desktop app for current platform
npm run electron:build:mac   # Build for macOS (DMG, ZIP)
npm run electron:build:win   # Build for Windows (NSIS, portable)
npm run electron:build:linux # Build for Linux (AppImage, DEB)

# Testing
npm test                # Run Jest unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
npm run lint            # ESLint auto-fix
npm run lint:check      # ESLint check only
```

**Note**: Azure and Deepgram transcription providers require HTTPS even in development. Run `npm run generate:certs` first, then `npm run serve:https`.

## Code Quality Standards

This project follows strict code quality standards to maintain maintainability and reliability.

### Module System

**Critical**: This project uses **CommonJS** (not ES modules).

- `package.json` does **NOT** include `"type": "module"`
- Configuration files (babel.config.js, jest.config.js, vue.config.js, eslint.config.js) use `module.exports`
- Source files in `src/` use ES modules (`import`/`export`) which are handled by Babel/Webpack
- Scripts and Electron files use CommonJS (`require`/`module.exports`)

**Why this matters**: Mixing module systems causes build failures. Always use CommonJS for Node.js configs, ES modules for Vue source files.

### Linting and Formatting

**ESLint Configuration**:
- Uses ESLint 9.0.0 with flat config format ([eslint.config.js](eslint.config.js))
- Integrates Prettier for consistent formatting
- Key rules:
  - `no-console` and `no-debugger` allowed in development, warned in production
  - `vue/multi-word-component-names`: Off (single-word components allowed)
  - `vue/no-v-html`: Off (DOMPurify sanitizes all HTML before rendering)
  - `prettier/prettier`: Enforced as errors

**Prettier Configuration** ([.prettierrc.cjs](.prettierrc.cjs)):
- Single quotes, 2-space indentation, 100-character line width
- ES5 trailing commas, Unix line endings
- Vue script/style indentation disabled

**Running Quality Checks**:
```bash
npm run lint:check    # Verify no lint errors
npm run format:check  # Verify formatting is correct
npm run lint          # Auto-fix lint issues
npm run format        # Auto-fix formatting issues
```

### Testing Standards

- **Framework**: Jest 29.7.0 with Vue Test Utils
- **Environment**: jsdom for browser simulation
- **Coverage**: Collected for all JS files except entry points
- **Test Location**: `tests/unit/` directory
- **Naming**: Tests use `.spec.js` extension

**Current Status**:
- 31 test suites
- 1088 tests
- All tests passing

**Test Patterns**:
- Provider tests: Concrete implementations extending base classes
- Composable tests: Mock localStorage and timers
- Component tests: Mount with Vue Test Utils
- Utility tests: Pure function testing

### Code Quality Rules

When making changes:

1. **Never silence lint rules** without justification
2. **Remove unused catch parameters** instead of prefixing with underscore (unless intentionally documenting)
3. **Use descriptive error messages** with context
4. **Validate inputs at entry points**
5. **Throw descriptive errors** from providers—never swallow silently
6. **Prefer fixing code over changing tests**
7. **Only change tests if they're clearly wrong** (obsolete, flaky, asserting wrong behavior)

### Common Patterns

**Catch Blocks** (remove unused parameters):
```javascript
// ✅ Correct - parameter removed
try {
  doSomething();
} catch {
  // Handle error without using error object
}

// ❌ Avoid - unused parameter
try {
  doSomething();
} catch (error) {
  // error not used
}
```

**Error Handling** (descriptive messages):
```javascript
// ✅ Correct - descriptive with context
throw new Error(
  `[${providerName}] Failed to initialize: ${originalError.message}`
);

// ❌ Avoid - vague error
throw new Error('Failed');
```

## Learnings from Code Quality Remediation

This section captures critical learnings from the March 2026 code quality remediation to prevent future issues.

### Critical Module System Issue

**The Problem**: Adding `"type": "module"` to package.json breaks everything

**What Happened**:
- Someone added `"type": "module"` to package.json, thinking it would enable ES modules
- This caused Node.js to treat ALL `.js` files as ES modules
- Build tools (Vue CLI, Jest) require CommonJS config files
- Result: Complete build and test failure with errors like:
  ```
  ReferenceError: require is not defined in ES module scope
  ReferenceError: module is not defined in ES module scope
  ```

**Why It Failed**:
- Configuration files (babel.config.js, jest.config.js, vue.config.js, eslint.config.js) use `module.exports` (CommonJS)
- When `"type": "module"` is set, Node.js treats `.js` files as ES modules
- `require` and `module.exports` don't exist in ES module scope
- Vue CLI and Jest can't load their configurations

**The Fix**:
1. Remove `"type": "module"` from package.json
2. Keep config files using CommonJS (`module.exports`)
3. Source files in `src/` can still use ES modules (`import`/`export`) because Babel/Webpack handles them

**Key Insight**: Vue.js projects use a **hybrid module system**:
- Node.js configs: CommonJS (`.js` files with `module.exports`)
- Vue source files: ES modules (`import`/`export` handled by Babel)
- Never use `"type": "module"` in package.json for Vue CLI projects

### ESLint Configuration Pitfalls

**Flat Config Migration** (ESLint 9.0+):

ESLint 9.0 uses a new "flat config" format that's different from the legacy `.eslintrc.js` format.

**Common Mistake**: Using ES module syntax in eslint.config.js while the project uses CommonJS

**Wrong** (causes performance warnings):
```javascript
// eslint.config.js
import js from '@eslint/js';
import vue from 'eslint-plugin-vue';

export default [
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
];
```

**Correct** (matches project's CommonJS setup):
```javascript
// eslint.config.js
const js = require('@eslint/js');
const vue = require('eslint-plugin-vue');

module.exports = [
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
];
```

**Rule Disabling Best Practices**:

When you must disable an ESLint rule:

1. **Add a comment explaining WHY**:
   ```javascript
   // eslint-disable-next-line vue/no-v-html -- Content sanitized by DOMPurify
   <div v-html="sanitizedContent" />
   ```

2. **Prefer disabling locally over globally**:
   ```javascript
   // ✅ Better - disable only where needed
   /* eslint-disable vue/no-v-html */
   <div v-html="content" />
   /* eslint-enable vue/no-v-html */

   // ⚠️ Acceptable - disable globally with strong justification
   // In eslint.config.js:
   'vue/no-v-html': 'off', // Disabled - DOMPurify sanitizes all HTML
   ```

3. **Never disable without justification** - Every disabled rule should have a comment explaining why it's safe to ignore

### Unused Variables in Catch Blocks

**The Issue**: ESLint's `no-unused-vars` rule flags unused error parameters in catch blocks

**Wrong Approaches**:
```javascript
// ❌ Don't prefix with underscore (looks accidental)
try {
  doSomething();
} catch (_error) {
  // error not used
}

// ❌ Don't disable the rule inline (creates noise)
try {
  doSomething();
} catch (error) {
  // eslint-disable-next-line no-unused-vars
  // error not used
}
```

**Correct Approach**:
```javascript
// ✅ Remove the parameter entirely
try {
  doSomething();
} catch {
  // Handle error without using error object
}
```

**Why This Is Better**:
- Cleaner code
- Clear intent (we're intentionally ignoring the error)
- No lint noise
- Valid JavaScript syntax (optional catch binding)

**When to Keep the Parameter**:
Only when you actually use it:
```javascript
try {
  doSomething();
} catch (error) {
  console.error('Operation failed:', error.message);
  // Log to error tracking service
  trackError(error);
}
```

### Quality Check Workflow

**Before Committing Code**:

Always run these commands in order:

```bash
# 1. Check formatting first (quickest)
npm run format:check

# 2. Check linting
npm run lint:check

# 3. Run tests
npm test

# 4. Try building (if you changed build-related files)
npm run build
```

**If Any Check Fails**:

1. **Format issues**: Run `npm run format` to auto-fix
2. **Lint issues**:
   - Try `npm run lint` to auto-fix
   - For manual fixes, read the error message carefully
   - If you must disable a rule, add a comment explaining why
3. **Test failures**:
   - Read the test output carefully
   - Check if it's a real bug or a test issue
   - Fix the code, not the test (unless test is clearly wrong)
4. **Build failures**:
   - Check module system first (look for "require is not defined" errors)
   - Verify config files use correct syntax
   - Check for missing dependencies

### Common Build Failures and Solutions

**Error: "require is not defined in ES module scope"**

**Cause**: Module system mismatch - usually `"type": "module"` in package.json

**Solution**:
1. Remove `"type": "module"` from package.json
2. Ensure config files use `module.exports` (CommonJS)
3. Source files can still use `import`/`export` (handled by Babel)

**Error: "module is not defined in ES module scope"**

**Cause**: Same as above - config file using CommonJS but treated as ES module

**Solution**: Same as above

**Error: Jest can't find tests**

**Cause**: testMatch patterns don't match your test files

**Check**:
```javascript
// In jest.config.js
testMatch: [
  '<rootDir>/tests/**/*.(spec|test).js',  // Make sure extension matches
  '<rootDir>/src/**/__tests__/**/*.js',
  '<rootDir>/src/**/*.spec.js',
],
```

**Error: "Cannot find module '@/xxx'"**

**Cause**: Jest moduleNameMapper not configured

**Check**:
```javascript
// In jest.config.js
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
},
```

### Testing Best Practices

**When Tests Fail**:

1. **Read the error message** - It usually tells you what's wrong
2. **Check the test code** - Is the test correct?
3. **Check the production code** - Is there a bug?
4. **Fix the code, not the test** - Unless the test is clearly wrong

**When to Change Tests**:

Only change tests when:
- Test is checking for obsolete behavior
- Test has a bug (wrong assertion, wrong setup)
- Test is flaky (fails intermittently)
- Requirements changed and test is outdated

**When NOT to Change Tests**:

- Test exposes a real bug in production code
- Test fails because you changed an API contract
- Test fails because you removed a feature
- Test is "too strict" (it's doing its job)

### Code Review Checklist

When reviewing changes (your own or others'), check:

**Module System**:
- [ ] No `"type": "module"` in package.json
- [ ] Config files use `module.exports` (CommonJS)
- [ ] Source files use `import`/`export` (ES modules)

**Code Quality**:
- [ ] No `console.log` left in production code
- [ ] No unused variables
- [ ] No commented-out code
- [ ] Error messages are descriptive
- [ ] Catch blocks either use error or omit parameter

**Testing**:
- [ ] All tests pass
- [ ] New features have tests
- [ ] Bug fixes have tests (if applicable)
- [ ] No tests commented out

**Documentation**:
- [ ] CLAUDE.md updated if patterns changed
- [ ] Complex logic has comments
- [ ] ESLint rule disables have explanations

### Performance Considerations

**Build Size Warnings**:

You may see warnings like:
```
asset size limit: The following asset(s) exceed the recommended size limit
```

**This is normal for this project** because:
- Element Plus UI library is large
- PDF.js for PDF processing
- Multiple AI provider SDKs
- Electron bundling

**Don't worry about these unless**:
- Bundle size suddenly increases significantly
- Users complain about slow loading
- You're adding new heavy dependencies

**To Reduce Bundle Size** (if needed):
1. Use dynamic imports for routes
2. Lazy-load heavy components
3. Consider tree-shaking for large libraries
4. Use CDN links for vendor libraries

### Troubleshooting Guide

**Problem: npm install fails**

Try:
```bash
rm -rf node_modules package-lock.json
npm install
```

**Problem: npm run serve fails**

Check:
1. Port 8080 is not in use (`lsof -i :8080`)
2. node_modules are installed (`npm install`)
3. Clear Vue CLI cache: `rm -rf .vue-cli-service`

**Problem: npm test fails with "Cannot find module"**

Check:
1. jest.config.js has correct moduleNameMapper
2. Test file imports use correct paths (`@/` alias)
3. Module being tested exists
4. Run `npm install` to ensure dependencies installed

**Problem: ESLint says "module is not defined"**

Check:
1. package.json doesn't have `"type": "module"`
2. eslint.config.js uses `require()` not `import`
3. You're not mixing module systems in same file

**Problem: Vue component not found**

Check:
1. File path in import is correct
2. File exists and has correct extension
3. Component has `export default`
4. Router configuration includes the route

## High-Level Architecture

This is a **serverless Vue 3 SPA** that provides real-time speech transcription and AI-generated responses as a general-purpose assistant. All configuration is stored in localStorage—no backend server required.

**Key architectural patterns:**
- **Provider Pattern**: Abstract base classes with registry pattern for extensibility
- **Multi-Provider Architecture**: 6 AI providers, 4 transcription providers
- **Vue 3 Composition API**: All components use `<script setup>` syntax
- **localStorage-based Configuration**: Centralized through config_util.js
- **Dual-Mode Application**: Web SPA + Electron desktop app

## Electron Desktop App Architecture

The application runs as both a web application and a native desktop app using Electron.

**Main Process** ([electron/main.js](electron/main.js)):
- Creates transparent, frameless, always-on-top overlay window
- System tray icon with context menu
- Global keyboard shortcuts (Cmd/Ctrl+Shift+Space to toggle)
- Window management (hide, show, move, resize)

**IPC Communication Pattern:**
- **Renderer → Main (one-way)**: `window.electronAPI?.hideWindow()`, `window.electronAPI?.moveWindow(dx, dy)`
- **Renderer → Main (two-way)**: `const screenshot = await window.electronAPI?.takeScreenshot()`
- **Main → Renderer**: System events, window state changes

**Preload Bridge** ([electron/preload.js](electron/preload.js)):
- Context bridge for secure renderer ↔ main communication
- Exposes safe API via `window.electronAPI`
- Methods: `isElectron`, `hideWindow`, `moveWindow`, `takeScreenshot`, `captureScreen`

**Electron Composable** ([src/composables/useElectron.js](src/composables/useElectron.js)):
- Vue integration layer for Electron APIs
- Environment detection: `const isElectron = !!window.electronAPI?.isElectron`

**Key patterns:**
```javascript
// Environment detection
if (window.electronAPI?.isElectron) {
  // Electron-specific code
} else {
  // Browser fallback
}

// IPC invocation
const screenshot = await window.electronAPI?.takeScreenshot();
```

## Provider Architecture (Core Pattern)

The application uses a **provider registry pattern** for both AI and transcription services.

**Base Classes:**
- [src/services/ai/BaseAIProvider.js](src/services/ai/BaseAIProvider.js) - Abstract base for AI providers
- [src/services/transcription/BaseTranscriptionProvider.js](src/services/transcription/BaseTranscriptionProvider.js) - Abstract base for transcription providers

**Registries:**
- [src/services/ai/providerRegistry.js](src/services/ai/providerRegistry.js) - AI provider registry
- [src/services/transcription/transcriptionRegistry.js](src/services/transcription/transcriptionRegistry.js) - Transcription provider registry

**Provider Locations:**
- AI: [src/services/ai/providers/](src/services/ai/providers/) (OpenAI, Zai, Ollama, MLX, Anthropic, Gemini)
- Transcription: [src/services/transcription/providers/](src/services/transcription/providers/) (Azure, Whisper, WebSpeech, Deepgram)

### Adding a New Provider

1. **Extend the base class** for the provider type
2. **Implement required methods** (see below)
3. **Register in the appropriate registry** (e.g., `registerDefaultProviders()`)
4. **Add config functions** to [src/utils/config_util.js](src/utils/config_util.js)
5. **Add UI configuration** in the appropriate Settings component

### Required AI Provider Methods

All AI providers must extend `BaseAIProvider` and implement:

```javascript
async initialize(config)
// Validate config, set this.config, set this.initialized = true

async generateCompletionStream(prompt, onChunk, options = {})
// Stream response, call onChunk(text) per chunk
// Vision providers: options.imageDataUrls array of base64 images

async validateConfig()
// Return { valid, errors, diagnostics }

getProviderInfo()
// Return metadata object with: id, name, description, supportsStreaming,
// requiresApiKey, requiresLocalServer, documentationUrl, defaultModels,
// configFields
```

### Vision-Capable Providers

Some AI providers support image input alongside text prompts:

**GeminiProvider** ([src/services/ai/providers/GeminiProvider.js](src/services/ai/providers/GeminiProvider.js)):

- Google Gemini 1.5/2.0 with vision support
- Streaming and non-streaming completion
- Direct REST API (no SDK dependency)
- **Vision API usage**:

  ```javascript
  await provider.generateCompletionStream(
    prompt,
    onChunk,
    { imageDataUrls: ['data:image/png;base64,...'] }
  );
  ```

- Implementation uses multipart content with `inlineData` parts for images
- Supports multiple images in a single request

### Required Transcription Provider Methods

All transcription providers must extend `BaseTranscriptionProvider` and implement:

```javascript
async initialize(config)
// Validate config, set this.config, set this.initialized = true

async startRecognition(onResult, onError)
// Start listening, call onResult(transcript) per result

async stopRecognition()
// Stop listening, set this.isRecording = false

async validateConfig()
// Return { valid, errors, warnings, diagnostics }

checkBrowserSupport()
// Return boolean

getProviderInfo()
// Return metadata object (same shape as AI providers)
```

## Composables Architecture

Vue 3 composables provide reusable logic for cross-cutting concerns.

**[src/composables/useAutoMode.js](src/composables/useAutoMode.js)** - Auto-response system:

- **Dual trigger system**: Transcript silence detection + screenshot polling
- **Configuration**:

  - `triggerDelay`: Time to wait after speech stops (500-8000ms, default: 2500ms)
  - `screenshotInterval`: Time between auto-captures (0 = disabled)
  - `diffThreshold`: Minimum pixel change to trigger (0.01-0.2 = 1-20%)

- **Pixel change detection**: 32x32 downsampling for efficient comparison
- **Usage pattern**:

  ```javascript
  const { isAutoMode, setupAutoMode, cancelAutoMode } = useAutoMode();
  setupAutoMode(transcript, onAskAI, imageDataUrls);
  ```

**[src/composables/useElectron.js](src/composables/useElectron.js)** - Electron integration:

- Environment detection: `const isElectron = !!window.electronAPI?.isElectron`
- IPC helpers: `hideWindow()`, `moveWindow()`, `takeScreenshot()`
- Abstracts platform-specific behavior

**[src/composables/useOverlayMode.js](src/composables/useOverlayMode.js)** - Floating overlays:

- **Document Picture-in-Picture** (Chrome 116+): True floating window
- **CSS mini-mode**: Fixed overlay fallback
- Global Alt+M shortcut registration
- Auto-styles copying to PiP window

**[src/composables/useMobile.js](src/composables/useMobile.js)** - Device detection:

- Mobile vs desktop detection
- Responsive layout helpers
- Platform-specific feature detection

## Configuration Pattern

All settings are persisted in **localStorage** through helper functions in [src/utils/config_util.js](src/utils/config_util.js).

**Pattern for each setting:**
```javascript
function provider_setting_name() {
    return localStorage.getItem("storage_key") || "default_value"
}
```

**Usage:**
- Components read via `import config from '@/utils/config_util'` then `config.openai_api_key()`
- Components write directly via `localStorage.setItem("key", "value")`
- No setters in config_util—write directly to localStorage

## Key File Locations

**Core Architecture:**
- [src/services/ai/providers/](src/services/ai/providers/) - AI provider implementations
- [src/services/transcription/providers/](src/services/transcription/providers/) - Transcription provider implementations
- [src/utils/config_util.js](src/utils/config_util.js) - Centralized configuration access
- [src/utils/diagnostic_util.js](src/utils/diagnostic_util.js) - Provider diagnostics and health checks
- [src/utils/pdf_util.js](src/utils/pdf_util.js) - PDF text extraction (PDF.js)
- [src/utils/website_util.js](src/utils/website_util.js) - Web scraping with CORS proxy fallbacks
- [src/utils/markdown_util.js](src/utils/markdown_util.js) - Markdown rendering (markdown-it)
- [src/utils/screenshot_util.js](src/utils/screenshot_util.js) - Screenshot capture (Electron + browser)

**Composables:**
- [src/composables/useAutoMode.js](src/composables/useAutoMode.js) - Auto-response system
- [src/composables/useElectron.js](src/composables/useElectron.js) - Electron integration
- [src/composables/useOverlayMode.js](src/composables/useOverlayMode.js) - Picture-in-Picture overlays
- [src/composables/useMobile.js](src/composables/useMobile.js) - Device detection

**Electron:**
- [electron/main.js](electron/main.js) - Electron main process
- [electron/preload.js](electron/preload.js) - Context bridge for IPC

**Vue Components:**
- [src/views/HomeView.vue](src/views/HomeView.vue) - Main session interface (mobile/desktop responsive)
- [src/views/settings/AISettings.vue](src/views/settings/AISettings.vue) - AI provider configuration
- [src/views/settings/SpeechSettings.vue](src/views/settings/SpeechSettings.vue) - Transcription configuration
- [src/views/settings/ContentSettings.vue](src/views/settings/ContentSettings.vue) - System prompt, context, PDF upload
- [src/views/settings/SettingsLayout.vue](src/views/settings/SettingsLayout.vue) - Shared settings shell with tab nav
- [src/views/settings/ElectronSettings.vue](src/views/settings/ElectronSettings.vue) - Desktop app configuration
- [src/components/MarkdownViewer.vue](src/components/MarkdownViewer.vue) - Markdown rendering component
- [src/components/MyTimer.vue](src/components/MyTimer.vue) - Session countdown/elapsed timer
- [src/components/LoadingIcon.vue](src/components/LoadingIcon.vue) - Reusable loading spinner
- [src/components/OverlayPanel.vue](src/components/OverlayPanel.vue) - Floating overlay UI

**Configuration:**
- [vue.config.js](vue.config.js) - Build configuration with HTTPS support, CORS headers
- [package.json](package.json) - Dependencies and scripts
- [jest.config.js](jest.config.js) - Jest test configuration

## Screenshot Functionality

**[src/utils/screenshot_util.js](src/utils/screenshot_util.js)** - Dual implementation pattern for screen capture.

**Electron mode:**

- Silent capture using `screenshot-desktop` npm package
- High-resolution, multi-monitor support
- No user interaction required
- Access via `window.electronAPI?.takeScreenshot()`

**Browser mode:**

- `getDisplayMedia` API with user permission
- Screen source enumeration (multiple monitors/windows)
- Stream management for capture
- Fallback for non-Electron environments

**Pixel difference calculation:**

```javascript
calculatePixelDiff(img1, img2) {
  // Downsample to 32x32, compare pixel differences
  // Returns 0.0-1.0 (0% to 100% change)
}
```

Used by auto-mode for intelligent screenshot-based triggering.

## Important Patterns

### SSE Streaming Pattern

All AI providers use this Server-Sent Events pattern for streaming responses:

```javascript
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const content = this.parseStreamChunk(chunk);
    if (content) onChunk(content);
}
```

Most providers parse OpenAI-compatible SSE format:
```javascript
parseStreamChunk(chunk) {
    const lines = chunk.split('\n');
    let content = '';
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine.startsWith('data: ')) continue;
        const data = trimmedLine.slice(6);
        if (data === '[DONE]') continue;
        try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.content) content += delta.content;
        } catch (e) {
            console.warn('Error parsing stream chunk:', e.message);
        }
    }
    return content;
}
```

### Naming Conventions

- **Classes**: PascalCase (`ZaiProvider`, `WebSpeechTranscriptionProvider`)
- **Functions/Methods**: camelCase (`generateCompletionStream`, `parseStreamChunk`)
- **Config Functions**: snake_case (`openai_api_key`, `gpt_model`, `azure_region`)
- **localStorage Keys**: snake_case strings (`"openai_key"`, `"gpt_model"`)
- **Provider IDs**: lowercase-hyphenated (`'zai'`, `'webspeech'`, `'openai'`)
- **Log Prefixes**: `[ProviderName]` bracket format (`[Z.ai]`, `[Web Speech Transcription]`)

### Error Handling Patterns

- **Throw descriptive errors** from providers—never swallow silently
- **Use `console.warn`** for non-fatal issues (retry attempts, iOS quirks)
- **Use `console.error`** for failures with context: `console.error('[Provider] Action failed:', error)`
- **Validate inputs** at the top of public methods, throw early with clear messages
- **SSRF protection** in URL validation: block localhost, 127.0.0.1, private IP ranges

### Guard Pattern

Always check initialization before use:
```javascript
if (!this.initialized) {
    throw new Error('Provider not initialized. Call initialize() first.');
}
```

### IPC Communication Pattern

Electron renderer process communicates with main process via exposed API:

```javascript
// Renderer → Main (one-way events)
window.electronAPI?.hideWindow();
window.electronAPI?.moveWindow(dx, dy);

// Renderer → Main (two-way with response)
const screenshot = await window.electronAPI?.takeScreenshot();

// Environment detection
const isElectron = !!window.electronAPI?.isElectron;
```

### Environment-Specific Behavior Pattern

Code that needs to handle both Electron and browser environments:

```javascript
if (window.electronAPI?.isElectron) {
  // Electron-specific code (silent screenshot, etc.)
} else {
  // Browser fallback (user permission required)
}
```

### Vue Component Patterns

- Use `<script setup>` (Composition API) exclusively—no Options API
- Import config: `import config from '@/utils/config_util'`
- Import registries: `import { providerRegistry } from '@/services/ai/providerRegistry'`
- Use Element Plus components (`el-button`, `el-input`, `el-select`, etc.)
- Route navigation via `useRouter()` composable

## Auto Mode

Auto mode automatically fires AI responses based on two triggers:

**Transcript trigger:**

- Fires AI response after N ms of silence (default: 2500ms)
- Configurable via `autoModeTriggerDelay` in localStorage (500-8000ms)
- Debounced to avoid firing while user is still speaking

**Screenshot trigger:**

- Polls every N ms (configured via `autoModeScreenshotInterval`)
- Fires only if pixel change > threshold (configured via `autoModeDiffThreshold`)
- Threshold range: 0.01-0.2 (1% to 20% pixel change)
- Uses 32x32 downsampling for efficient comparison

**UI indicator:**

- Lightning bolt (⚡) button shows active/inactive state
- Toggle to enable/disable auto mode
- Status shown in header

**Configuration stored in localStorage:**

- `autoModeTriggerDelay`: Silence delay in milliseconds
- `autoModeScreenshotInterval`: Polling interval (0 = disabled)
- `autoModeDiffThreshold`: Minimum pixel change (0.01-0.2)

## Technology Stack

- **Vue 3.4** with Composition API (`<script setup>`)
- **Vue Router 4** with hash-based routing (`createWebHashHistory`)
- **Pinia** for state management (available but most state is localStorage-based)
- **Element Plus** UI framework with full icon set
- **OpenAI SDK** (^6.29.0) for OpenAI API
- **Microsoft Cognitive Services SDK** (^1.33.1) for Azure Speech
- **PDF.js** (^5.5.207) for PDF text extraction
- **marked** (^17.0.4) + **DOMPurify** (^3.0.6) for Markdown parsing and sanitization
- **turndown** (^7.2.2) for HTML-to-Markdown conversion
- **axios** (^1.6.2) for HTTP requests

## Browser APIs Used

- **Web Speech API** - Browser-native speech recognition (no API key needed)
- **localStorage** - All configuration persistence
- **MediaRecorder / getUserMedia** - Audio capture for Whisper/Deepgram
- **Fetch / ReadableStream** - SSE streaming for AI responses
- **FileReader** - PDF file reading

## Mobile Development Notes

- The app is mobile-responsive with separate header layouts for mobile/desktop
- CORS proxy fallbacks are built into [website_util.js](src/utils/website_util.js) for mobile network restrictions
- Device detection composable: [src/composables/useMobile.js](src/composables/useMobile.js)
- Some speech APIs require HTTPS even in development (use `npm run serve:https`)
- Mobile timeout is 30 seconds vs 20 seconds on desktop for website fetching
- iOS Safari has stricter security policies - test on Chrome if needed

## Development Workflow

### Getting Started

```bash
# Clone and install
git clone <repo-url>
cd your-assistant
npm install

# Start development server (hot-reload enabled)
npm run serve

# Open browser to http://localhost:8080
```

### Testing Strategy

The project uses **Jest** with **Vue Test Utils** and **jsdom** for automated testing.

**Test Configuration** ([jest.config.js](jest.config.js)):

- jsdom environment for browser simulation
- Vue component transformation
- Path mapping for `@/` aliases
- Coverage collection from all JS files

**Test Files:**

- [src/utils/config_util.spec.js](src/utils/config_util.spec.js) - localStorage configuration testing
- [src/components/LoadingIcon.spec.js](src/components/LoadingIcon.spec.js) - Component rendering tests

**Test Setup** ([tests/setup.js](tests/setup.js)):

- Global mocks: localStorage, sessionStorage, fetch, matchMedia
- Console method preservation

**Manual Testing** - Key areas to test:

1. **Provider Switching**: Test all AI and transcription provider combinations
2. **Connection Tests**: Use "Test Connection" buttons in settings
3. **Full Flow**: Start session, verify transcription and AI responses
4. **Edge Cases**: Invalid API keys, network failures, microphone permissions
5. **Browser Compatibility**: Chrome/Edge (recommended), Firefox (limited), Safari (limited)

### Diagnostic Tools

- **Web Speech API**: Open `http://localhost:8080/speech-test.html` for 5-test diagnostic suite
- **Browser Console**: F12 → Console tab for errors
- **Network Tab**: F12 → Network tab for inspecting API requests
- **Connection Tests**: Built-in "Test Connection" buttons in settings UI

### Building for Production

**Web builds:**

```bash
npm run build
# Creates optimized dist/ folder for GitHub Pages
```

**Electron builds:**

```bash
npm run electron:build         # Build for current platform
npm run electron:build:mac     # Build for macOS (DMG, ZIP)
npm run electron:build:win     # Build for Windows (NSIS, portable)
npm run electron:build:linux   # Build for Linux (AppImage, DEB)
# Creates release/ folder with platform-specific installers
```

**Electron development:**

```bash
npm run electron:dev         # Hot-reload with HTTP
npm run electron:dev:https   # Hot-reload with HTTPS (required for microphone)
```

## CI/CD Pipeline

This project uses a fully automated CI/CD pipeline via GitHub Actions.

### Workflow File

**[.github/workflows/ci.yml](.github/workflows/ci.yml)** - Consolidated CI/CD pipeline

### Pipeline Architecture

**Automatic Releases on Merge to Main:**

Every push to `main` triggers a fully automated release:

1. **First Run (push to main):**
   - Quality checks (lint, format)
   - Tests across Node 24.x and 25.x
   - Build Vue app for web
   - Build Vue app for Electron
   - Build Electron apps for macOS, Windows, Linux
   - Deploy to GitHub Pages
   - **Auto-Release Job**: Bumps version, creates tag

2. **Second Run (tag push):**
   - All quality and build jobs run again
   - **Create GitHub Release** with all installer artifacts

### Artifacts Generated

Each release automatically includes:

**macOS:**
- `Your Assistant-<version>-arm64.dmg` - Disk image installer
- `Your Assistant-<version>-arm64-mac.zip` - ZIP archive
- `checksums.txt` - SHA256 checksums

**Windows:**
- `Your Assistant-Setup <version>.exe` - NSIS installer
- `Your Assistant-<version>-win.zip` - Portable ZIP archive

**Linux:**
- `Your-Assistant-<version>.AppImage` - Universal AppImage
- `your-assistant_<version>_amd64.deb` - Debian package

### Version Management

- **Automatic version bumping** on every merge to main (patch version)
- **Semantic versioning**: major.minor.patch (e.g., 1.0.0 → 1.0.1)
- **Tags** created automatically: v1.0.0, v1.0.1, v1.0.2, etc.
- **package.json** updated automatically by CI

### Manual Releases

For major/minor version bumps (e.g., 1.0.0 → 2.0.0 or 1.0.0 → 1.1.0):

1. Update version manually in [package.json](package.json)
2. Commit and push to main
3. CI will create the release with your specified version

### Monitoring

- **Workflow runs**: `https://github.com/gannino/your-assistant/actions`
- **Releases**: `https://github.com/gannino/your-assistant/releases`
- **GitHub Pages**: `https://gannino.github.io/your-assistant`

### Deployment

**Web deployment:**

- Deploy `dist/` folder to GitHub Pages or any static hosting
- No backend required - fully client-side SPA
- PWA-ready with manifest.json

**Electron deployment:**

- Platform-specific installers in `release/` folder
- macOS: DMG and ZIP distributions
- Windows: NSIS installer and portable executable
- Linux: AppImage and DEB packages

## Commit Message Conventions

Use conventional commits format:

- `feat:` - New feature (e.g., "feat: add support for new AI provider")
- `fix:` - Bug fix (e.g., "fix: resolve memory leak in transcription")
- `docs:` - Documentation changes (e.g., "docs: update provider setup guide")
- `style:` - Code style changes (e.g., "style: format code with prettier")
- `refactor:` - Code refactoring (e.g., "refactor: simplify provider registry")
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## Common Development Issues

### Hot Reload Not Working

- Restart dev server: `Ctrl+C` then `npm run serve`
- Clear browser cache (Ctrl+Shift+Delete)
- Check file watchers are working

### Build Failures

- Check Node.js version (use LTS)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear npm cache: `npm cache clean --force`

### Provider Not Showing in Settings

- Verify provider is registered in registry (e.g., `providerRegistry.register()`)
- Check import paths are correct
- Check browser console for initialization errors

### API Requests Failing in Development

- Check CORS settings in [vue.config.js](vue.config.js)
- Verify API credentials in localStorage (DevTools → Application → Local Storage)
- Check browser console for specific error messages
- Use Network tab to inspect request/response

### Web Speech API Network Error

- Common on corporate networks or with VPNs
- Disable VPN temporarily
- Try different network (home vs work)
- Use diagnostic tool: `speech-test.html`
- Fallback: Switch to Azure (5 free hours/month) or Deepgram (200 free hours/month)

### Azure/Deepgram HTTPS Requirement

These providers require HTTPS even in development:

```bash
npm run generate:certs  # Generate self-signed certificates
npm run serve:https     # Start dev server with HTTPS
```

## Code Quality Standards

### JavaScript/Vue Style

- Use ES6+ features (async/await, template strings, destructuring)
- Follow Vue.js style guide
- Use `<script setup>` Composition API exclusively
- Keep components small and focused
- Extract reusable logic to utilities

### Error Handling

- Always handle async errors with try/catch
- Provide user-friendly error messages
- Log errors with context: `console.error('[Provider] Action failed:', error)`
- Validate user input at entry points

### Comments and Documentation

- Use JSDoc for public methods: `@param`, `@returns`
- Document complex logic with inline comments
- Explain "why" not "what" in comments
- Keep comments up to date with code changes

### File Organization

- One class per file for providers
- Group related functions with section banners: `// ============================================`
- Use descriptive filenames that match content
- Keep utils focused and single-purpose

## Security Considerations

- **SSRF Protection**: URL validation blocks localhost, 127.0.0.1, private IP ranges (10.x, 172.16-31.x, 192.168.x)
- **API Keys**: Stored in localStorage only - never sent to any backend
- **CORS Proxies**: Website fetching uses trusted CORS proxies with fallbacks
- **Input Validation**: All user inputs validated before processing

**Electron Security:**

- **Context isolation**: `contextIsolation: true` prevents renderer from accessing Node.js APIs directly
- **Node integration disabled**: `nodeIntegration: false` prevents Node.js runtime in renderer
- **Context bridge**: All renderer ↔ main communication through [electron/preload.js](electron/preload.js)
- **Screenshot permissions**: User-initiated in browser mode, silent in Electron mode
- **IPC security**: Only specific methods exposed via context bridge, not entire Node.js API

## Reference Documentation

For detailed user-facing documentation:

- [Quick Start Guide](docs/QUICK_START.md) - Get running in 5 minutes
- [Architecture Guide](docs/ARCHITECTURE.md) - Comprehensive technical overview of the application architecture
- [Mobile Guide](docs/MOBILE_GUIDE.md) - Complete guide for mobile usage, troubleshooting, and development
- [AI Providers Setup](docs/AI_PROVIDERS_SETUP.md) - Detailed AI provider configuration
- [Transcription Providers Setup](docs/TRANSCRIPTION_PROVIDERS_SETUP.md) - Transcription setup
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Development Guide](docs/DEVELOPMENT_GUIDE.md) - Detailed development information
- [Provider Comparison](docs/PROVIDER_COMPARISON.md) - Side-by-side provider comparison
- [Documentation Updates](docs/DOCUMENTATION_UPDATES.md) - Summary of recent documentation improvements

# Project Structure — Your Assistant

## Top-Level Layout

```
your-assistant/
├── src/                    # Main Vue 3 application source
├── electron/               # Electron desktop wrapper
├── public/                 # Static assets served as-is
├── scripts/                # Build/cert/deployment helper scripts
├── docs/                   # Documentation markdown files
├── tests/                  # Jest test setup
├── .github/workflows/      # CI/CD (deploy.yml, test.yml)
├── package.json            # Root project config (Vue CLI + Electron)
└── vue.config.js           # Vue CLI configuration
```

## Main Application: `src/`

```
src/
├── main.js                 # App entry: Vue + ElementPlus + Pinia + Router
├── App.vue                 # Root component (router-view + overlay shortcut)
├── router/index.js         # Hash-based routing (/, /settings/*)
├── views/
│   ├── HomeView.vue        # Main session screen (transcription + AI panels)
│   └── settings/
│       ├── SettingsLayout.vue      # Shared settings shell with sidebar nav
│       ├── ContentSettings.vue     # PDF/website context management
│       ├── SpeechSettings.vue      # Transcription provider config
│       ├── AISettings.vue          # AI provider config
│       └── ElectronSettings.vue    # Opacity, blur, window size, auto mode
├── components/
│   ├── LoadingIcon.vue     # Reusable loading spinner
│   ├── MarkdownViewer.vue  # Markdown rendering component
│   ├── MyTimer.vue         # Session timer
│   └── OverlayPanel.vue    # Overlay/mini mode panel wrapper
├── composables/
│   ├── useAutoMode.js      # Auto-response: transcript debounce + screenshot polling
│   ├── useElectron.js      # Electron IPC bridge (isElectron, hideWindow, toggleMini)
│   ├── useMobile.js        # Mobile detection (isMobile reactive ref)
│   └── useOverlayMode.js   # Document PiP + CSS mini-mode toggle
├── services/
│   ├── ai/
│   │   ├── providerRegistry.js         # Singleton registry (Map-based)
│   │   └── providers/
│   │       ├── BaseAIProvider.js       # Abstract base class
│   │       ├── OpenAIProvider.js
│   │       ├── ZaiProvider.js          # Zhipu AI GLM-4 (OpenAI-compatible SSE)
│   │       ├── OllamaProvider.js
│   │       ├── MLXProvider.js
│   │       ├── AnthropicProvider.js
│   │       └── GeminiProvider.js
│   └── transcription/
│       ├── transcriptionRegistry.js    # Singleton registry (Map-based)
│       ├── BaseTranscriptionProvider.js # Abstract base class
│       └── providers/
│           ├── AzureTranscriptionProvider.js
│           ├── WhisperTranscriptionProvider.js
│           ├── WebSpeechTranscriptionProvider.js
│           └── DeepgramTranscriptionProvider.js
└── utils/
    ├── config_util.js      # All localStorage get/set for settings
    ├── pdf_util.js         # PDF parsing via pdfjs-dist
    ├── markdown_util.js    # Markdown rendering (marked + DOMPurify)
    ├── screenshot_util.js  # Screen capture + pixel diff (imageChangeFraction)
    ├── website_util.js     # Website scraping → markdown (turndown)
    └── diagnostic_util.js  # Debug/diagnostic helpers
```

## Electron Layer: `electron/`

```
electron/
├── main.js       # BrowserWindow (transparent, always-on-top), Tray, IPC handlers
├── preload.js    # Context bridge: exposes electronAPI to renderer
└── shortcuts.js  # Global keyboard shortcuts (Cmd+Shift+Space, Cmd+Shift+M, arrow keys)
```

## Routing Structure
```
/                       → HomeView (main session screen)
/settings               → redirect → /settings/content
/settings/content       → ContentSettings (PDF/website upload)
/settings/speech        → SpeechSettings (transcription provider)
/settings/ai            → AISettings (AI provider + model)
/settings/electron      → ElectronSettings (opacity, auto mode, shortcuts)
/setting                → legacy redirect → /settings/content
```

## Architectural Patterns

### Registry Pattern (Singleton)
Both `providerRegistry` and `transcriptionRegistry` use a `Map`-based singleton:
- `register(provider)` — adds by `provider.getProviderInfo().id`
- `get(id)` — retrieves by ID
- `getAll()` / `getAllInfo()` — enumerate all
- `has(id)` — existence check
- Providers registered in constructor via `registerDefaultProviders()`

### Abstract Base Class Pattern
- `BaseAIProvider` — defines interface: `initialize(config)`, `generateCompletionStream(prompt, onChunk, options)`, `generateCompletion(prompt, options)`, `validateConfig()`, `getProviderInfo()`
- `BaseTranscriptionProvider` — defines interface: `initialize()`, `startRecognition(onResult, onError)`, `stopRecognition()`, `validateConfig()`, `getProviderInfo()`, `checkBrowserSupport()`

### Composable Pattern (Vue 3)
- Composables export reactive state + functions
- `useAutoMode` uses module-level singleton state (not per-component)
- `useElectron` is a thin wrapper around `window.electronAPI` (context bridge)
- `useOverlayMode` manages Document PiP with CSS fallback

### Settings via localStorage
All configuration persisted in `localStorage` via `config_util.js`. No backend, no cookies for settings.

### Streaming AI Responses
All AI providers implement SSE/streaming via `generateCompletionStream(prompt, onChunk, options)`. HomeView uses `executeWithStreamingRecovery` wrapper with up to 2 reconnect attempts and a 30s stale stream monitor.

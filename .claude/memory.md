# Memory

## Project: Your Assistant

General-purpose real-time AI assistant with voice transcription.

### Tech Stack

- **Frontend**: Vue 3.4 (Composition API `<script setup>`) + Element Plus 2.5
- **Desktop**: Electron 31.7 (transparent overlay, frameless window)
- **State**: Pinia 2.1 + localStorage (no backend required)
- **Build**: Vue CLI 5.0 + Electron Builder
- **Testing**: Jest 29.7 + Vue Test Utils (43 suites, 1555 tests)
- **Linting**: ESLint 9.0 (flat config) + Prettier 3.1

### Architecture Patterns

- **Provider Registry**: Abstract base classes with registry pattern
- **AI Providers** (7): OpenAI, Zai, Ollama, MLX, Anthropic, Gemini, OpenRouter
- **Transcription Providers** (4): Azure, Whisper, Web Speech, Deepgram
- **Composables**: useAutoMode, useElectron, useOverlayMode, useMobile

### Key File Paths

- `src/services/ai/providerRegistry.js` - AI provider registry
- `src/services/transcription/transcriptionRegistry.js` - Transcription registry
- `src/utils/config_util.js` - localStorage configuration access
- `src/composables/` - Vue 3 reusable logic
- `electron/main.js` - Electron main process
- `electron/preload.js` - IPC context bridge

### Module System

**Critical**: Hybrid module system

- Config files: CommonJS (`module.exports`)
- Source files: ES modules (`import`/`export` via Babel)
- NEVER add `"type": "module"` to package.json

## User Goals

- **Production app**: Deploying, releasing, supporting users
- **Active development**: Adding features, fixing bugs
- **Maintenance**: Bug fixes, updates
- **Learning**: Understanding Vue/Electron patterns

## Workflow

- **Feature-focused**: Plan → Implement → Test → Document
- **Bug-fix focused**: Report → Debug → Fix → Verify

## Focus Areas

- AI integration (new providers, improved responses)
- Transcription (accuracy, new providers)
- UI/UX (overlay mode, mobile, settings)
- DevOps/CI/CD (builds, releases, testing)

## Tooling

- Cloud AI APIs (OpenAI, Anthropic, Gemini, etc.)
- GitHub Actions (CI/CD pipeline)
- Testing tools (Jest, Playwright)

## Now

**Test coverage improvement**: 61.51% → **81.79% statements, 82.48% lines** (80% target achieved ✅).

**Final test additions**:

- App.vue: ✅ 100% coverage (27 tests)
- HomeView.vue: ✅ 62.23% coverage (60 tests)

**Overall stats**: 45 test suites, 1642 tests passing.

**Coverage by module**:

- App.vue: 100%
- Settings views: 67.47%
- Components: 76.29%
- Utils: 85.66%
- Services: 87.96%
- HomeView.vue: 62.23% (from 0%)

**Thresholds not yet met**: Branches (77.8%), Functions (68.04%) — optional improvements.

## Open Threads

- (none)

## Recent Decisions

- (none)

## Blockers

- (none)

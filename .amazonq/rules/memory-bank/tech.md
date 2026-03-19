# Technology Stack — Your Assistant

## Core Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | Vue 3 (Composition API) | ^3.4.0 |
| Build Tool | Vue CLI Service | ~5.0.8 |
| UI Component Library | Element Plus | ^2.5.0 |
| State Management | Pinia | ^2.1.0 |
| Routing | Vue Router 4 (hash history) | ^4.2.0 |
| Desktop Wrapper | Electron | ^31.7.7 |
| Language | JavaScript (ES2021) | — |

## Key Runtime Dependencies

| Package | Purpose |
|---------|---------|
| `openai` ^6.29.0 | OpenAI API client (also used for compatible APIs) |
| `@anthropic-ai/sdk` | Anthropic Claude API |
| `microsoft-cognitiveservices-speech-sdk` ^1.33.1 | Azure Speech transcription |
| `pdfjs-dist` ^5.5.207 | PDF parsing in browser |
| `marked` ^17.0.4 | Markdown → HTML rendering |
| `dompurify` ^3.0.6 | Sanitize rendered HTML |
| `turndown` ^7.2.2 | HTML → Markdown (website scraping) |
| `axios` ^1.6.2 | HTTP client |
| `moment` ^2.29.4 | Date/time formatting |
| `pinia` ^2.1.0 | Vue state management |
| `universal-cookie` ^8.0.1 | Cookie utilities |

## Development Dependencies

| Package | Purpose |
|---------|---------|
| `eslint` ^8.57.0 | Linting |
| `eslint-plugin-vue` ^9.17.0 | Vue-specific lint rules |
| `prettier` ^3.1.0 | Code formatting |
| `jest` ^29.7.0 | Unit testing |
| `@vue/test-utils` ^2.4.0 | Vue component testing |
| `@vue/vue3-jest` ^29.2.6 | Jest transformer for .vue files |
| `jest-environment-jsdom` ^29.7.0 | Browser-like test environment |
| `electron-builder` ^24.13.3 | Electron packaging |
| `concurrently` ^8.2.2 | Run multiple npm scripts in parallel |
| `wait-on` ^7.2.0 | Wait for dev server before launching Electron |

## Code Quality Configuration

### ESLint (`.eslintrc.js`)
- Extends: `eslint:recommended`, `plugin:vue/vue3-recommended`, `@vue/prettier`
- `no-console`: off in dev, warn in production
- `vue/multi-word-component-names`: off
- `prettier/prettier`: error (enforced)

### Prettier (`.prettierrc.js`)
- `singleQuote: true`
- `semi: true`
- `tabWidth: 2`
- `trailingComma: 'es5'`
- `printWidth: 100`
- `endOfLine: 'lf'`
- `arrowParens: 'avoid'`
- `vueIndentScriptAndStyle: false`

## Testing

### Jest Configuration (`jest.config.js`)
- Environment: `jsdom`
- Transforms: `@vue/vue3-jest` for `.vue`, `babel-jest` for `.js`
- Module alias: `@/` → `src/`
- Coverage collected from `src/**/*.js` (excludes main.js, router, spec files)
- Coverage reporters: `text`, `lcov`, `html` → output to `coverage/`
- Test match: `src/**/*.spec.(js|ts)` and `src/**/__tests__/**/*`

### Running Tests
```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

## Build & Development Commands

```bash
# Development
npm run serve             # HTTP dev server on :8080
npm run serve:https       # HTTPS dev server (for microphone on mobile)
npm run serve:http        # Explicit HTTP

# Electron Development
npm run electron:dev      # Vue dev server + Electron (HTTP)
npm run electron:dev:https # Vue dev server + Electron (HTTPS, for mic)

# Production Build
npm run build             # Build to dist/ (GitHub Pages path: /your-assistant/)
npm run build:preview     # Build with NODE_ENV=production
npm run preview           # Serve dist/ on :3000

# Electron Packaging
npm run electron:build        # Build all platforms
npm run electron:build:mac    # macOS DMG + ZIP
npm run electron:build:win    # Windows NSIS + portable
npm run electron:build:linux  # Linux AppImage + deb

# Code Quality
npm run lint              # ESLint with auto-fix
npm run lint:check        # ESLint check only
npm run format            # Prettier write
npm run format:check      # Prettier check only

# Utilities
npm run generate:certs    # Generate self-signed certs for HTTPS dev
npm run test:deployment   # Build + run deployment smoke test
```

## Webpack / Vue CLI Configuration (`vue.config.js`)

- `publicPath`: `./` for Electron, `/your-assistant/` for GitHub Pages production, `/` for dev
- Dev server: `host: '0.0.0.0'`, CORS headers enabled, optional HTTPS via `VUE_APP_HTTPS=true`
- Special handling for `openai` ESM package: transpiled via babel-loader
- Alias: `@` → `src/`, pdfjs worker path resolved explicitly
- `resolve.fallback`: `module: false`, `path: false` (browser environment)

## Electron Build Configuration (`package.json` → `build`)

- `appId`: `com.yourassistant.app`
- Output: `release/` directory
- Bundles: `dist/**/*` + `electron/**/*`
- Mac: DMG + ZIP targets
- Win: NSIS + portable targets
- Linux: AppImage + deb targets



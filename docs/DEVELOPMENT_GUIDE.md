# Development Guide

This guide helps developers and contributors understand the Your Assistant codebase and make contributions.

## Table of Contents

- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Provider System](#provider-system)
- [Adding New Providers](#adding-new-providers)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Building and Deployment](#building-and-deployment)
- [Coding Standards](#coding-standards)
- [Contributing](#contributing)

---

## Project Structure

```
your-assistant/
├── public/                      # Static assets
│   ├── index.html              # Main HTML file
│   ├── speech-test.html        # Web Speech API diagnostic tool
│   └── favicon.ico
│
├── src/
│   ├── components/             # Vue components
│   │   ├── LoadingIcon.vue    # Loading animation component
│   │   ├── MyTimer.vue        # Session timer component
│   │   ├── MarkdownViewer.vue # Markdown rendering component
│   │   └── OverlayPanel.vue   # Floating overlay panel component
│   │
│   ├── services/              # Core business logic
│   │   ├── ai/               # AI provider system
│   │   │   ├── BaseAIProvider.js           # Abstract base class
│   │   │   ├── providerRegistry.js         # Provider registry
│   │   │   └── providers/                  # AI provider implementations
│   │   │       ├── OpenAIProvider.js
│   │   │       ├── ZaiProvider.js
│   │   │       ├── OllamaProvider.js
│   │   │       ├── MLXProvider.js
│   │   │       ├── AnthropicProvider.js
│   │   │       ├── GeminiProvider.js
│   │   │       └── OpenRouterProvider.js
│   │   │
│   │   └── transcription/    # Transcription provider system
│   │       ├── BaseTranscriptionProvider.js  # Abstract base class
│   │       ├── transcriptionRegistry.js      # Provider registry
│   │       └── providers/                   # Transcription implementations
│   │           ├── AzureTranscriptionProvider.js
│   │           ├── WhisperTranscriptionProvider.js
│   │           ├── WebSpeechTranscriptionProvider.js
│   │           └── DeepgramTranscriptionProvider.js
│   │
│   ├── utils/                 # Utility functions
│   │   └── config_util.js    # Configuration management (localStorage)
│   │
│   ├── views/                 # Vue views/pages
│   │   ├── HomeView.vue      # Main application view
│   │   └── settings/         # Settings pages
│   │       ├── SettingsLayout.vue  # Settings shell with tab navigation
│   │       ├── AISettings.vue      # AI provider configuration
│   │       ├── SpeechSettings.vue  # Transcription configuration
│   │       ├── ContentSettings.vue # System prompt & context
│   │       └── ElectronSettings.vue # Desktop app configuration
│   │
│   ├── App.vue               # Root component
│   └── main.js               # Application entry point
│
├── docs/                     # Documentation
│   ├── AZURE_SERVICE_TUTORIAL.md
│   ├── AI_PROVIDERS_SETUP.md
│   ├── TRANSCRIPTION_PROVIDERS_SETUP.md
│   ├── TROUBLESHOOTING.md
│   ├── PROVIDER_COMPARISON.md
│   └── DEVELOPMENT_GUIDE.md   # This file
│
├── package.json              # Dependencies and scripts
├── vue.config.js             # Vue CLI configuration
└── README.md                 # Project overview
```

---

## Architecture

### Provider Abstraction Pattern

Your Assistant uses a provider abstraction pattern to support multiple AI and transcription providers.

#### Benefits:
- **Extensibility**: Easy to add new providers
- **Maintainability**: Isolated provider code
- **Testability**: Each provider can be tested independently
- **Flexibility**: Users can switch providers without code changes

#### Key Components:

1. **Base Provider Classes**
   - `BaseAIProvider` - Abstract base for AI providers
   - `BaseTranscriptionProvider` - Abstract base for transcription providers

2. **Provider Registries**
   - `providerRegistry` - Manages AI providers
   - `transcriptionRegistry` - Manages transcription providers

3. **Provider Implementations**
   - Individual provider classes extending base classes

4. **Configuration Layer**
   - `config_util.js` - Manages provider configuration in localStorage

---

## Provider System

### AI Provider Interface

All AI providers must extend `BaseAIProvider` and implement:

```javascript
class CustomAIProvider extends BaseAIProvider {
  // Required: Initialize with configuration
  async initialize(config) {
    // Validate config
    // Set up API client
    this.initialized = true
  }

  // Required: Generate streaming completion
  async generateCompletionStream(prompt, onChunk, options = {}) {
    // Make API request
    // Call onChunk(text) for each piece of response
  }

  // Optional: Validate configuration
  async validateConfig() {
    // Check required fields
    return { valid: true, errors: [] }
  }

  // Optional: Get provider metadata
  getProviderInfo() {
    return {
      id: 'custom-provider',
      name: 'Custom Provider',
      description: 'Description here',
      supportsStreaming: true,
      requiresApiKey: true,
      // ... more metadata
    }
  }
}
```

### Transcription Provider Interface

All transcription providers must extend `BaseTranscriptionProvider` and implement:

```javascript
class CustomTranscriptionProvider extends BaseTranscriptionProvider {
  // Required: Initialize with configuration
  async initialize(config) {
    // Validate config
    // Set up client
    this.initialized = true
  }

  // Required: Start continuous speech recognition
  async startRecognition(onResult, onError) {
    // Start listening
    // Call onResult(transcript) for each result
    // Call onError(error) if something goes wrong
    this.isRecording = true
  }

  // Required: Stop recognition
  async stopRecognition() {
    // Stop listening
    this.isRecording = false
  }

  // Optional: Validate configuration
  async validateConfig() {
    return { valid: true, errors: [] }
  }

  // Optional: Get provider metadata
  getProviderInfo() {
    return {
      id: 'custom-transcription',
      name: 'Custom Transcription',
      description: 'Description here',
      supportsContinuous: true,
      requiresApiKey: true,
      // ... more metadata
    }
  }
}
```

---

## Adding New Providers

### Adding a New AI Provider

1. **Create Provider Class**

   Create `src/services/ai/providers/CustomProvider.js`:

   ```javascript
   import { BaseAIProvider } from './BaseAIProvider';

   export class CustomProvider extends BaseAIProvider {
     constructor() {
       super({});
       this.client = null;
     }

     async initialize(config) {
       if (!config.apiKey) {
         throw new Error('API key is required');
       }

       this.config = {
         apiKey: config.apiKey,
         model: config.model || 'default-model',
         endpoint: config.endpoint || 'https://api.example.com',
         ...config
       };

       this.client = new CustomClient(this.config.apiKey);
       this.initialized = true;
     }

     async generateCompletionStream(prompt, onChunk, options = {}) {
       const response = await fetch(`${this.config.endpoint}/v1/chat`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${this.config.apiKey}`
         },
         body: JSON.stringify({
           model: this.config.model,
           messages: [{ role: 'user', content: prompt }],
           stream: true
         })
       });

       const reader = response.body.getReader();
       const decoder = new TextDecoder();

       while (true) {
         const { done, value } = await reader.read();
         if (done) break;

         const chunk = decoder.decode(value);
         const content = this.parseStreamChunk(chunk);
         if (content) onChunk(content);
       }
     }

     parseStreamChunk(chunk) {
       // Parse SSE format and extract content
       // Implementation depends on provider's format
     }

     async validateConfig() {
       const errors = [];
       if (!this.config.apiKey) errors.push('API key is required');
       return {
         valid: errors.length === 0,
         errors,
         diagnostics: {
           model: this.config.model,
           hasApiKey: !!this.config.apiKey
         }
       };
     }

     getProviderInfo() {
       return {
         id: 'custom',
         name: 'Custom Provider',
         description: 'Custom AI provider',
         supportsStreaming: true,
         requiresApiKey: true,
         requiresLocalServer: false,
         defaultModels: ['model-1', 'model-2'],
         configFields: [
           { name: 'apiKey', label: 'API Key', type: 'password', required: true },
           { name: 'model', label: 'Model', type: 'text', required: false },
           { name: 'endpoint', label: 'API Endpoint', type: 'text', required: false }
         ]
       };
     }
   }
   ```

2. **Register Provider**

   Update `src/services/ai/providerRegistry.js`:

   ```javascript
   import { CustomProvider } from './providers/CustomProvider';

   class ProviderRegistry {
     registerDefaultProviders() {
       // ... existing providers
       this.register(new CustomProvider());
     }
   }
   ```

3. **Add Configuration Functions**

   Update `src/utils/config_util.js`:

   ```javascript
   // Custom Provider Configuration
   function custom_api_key() {
     return localStorage.getItem("custom_api_key")
   }

   function custom_model() {
     return localStorage.getItem("custom_model") || "default-model"
   }

   function custom_endpoint() {
     return localStorage.getItem("custom_endpoint") || "https://api.example.com"
   }

   export default {
     // ... existing exports
     custom_api_key,
     custom_model,
     custom_endpoint
   }
   ```

4. **Update Settings UI**

   Update `src/views/settings/AISettings.vue`:
   - Add provider to dropdown
   - Add configuration form
   - Add test connection logic

5. **Update HomeView Integration**

   Update `src/views/HomeView.vue`:
   - Add config to `getProviderConfig()` method

### Adding a New Transcription Provider

1. **Create Provider Class**

   Create `src/services/transcription/providers/CustomTranscriptionProvider.js`:

   ```javascript
   import { BaseTranscriptionProvider } from '../BaseTranscriptionProvider';

   export class CustomTranscriptionProvider extends BaseTranscriptionProvider {
     constructor() {
       super({});
       this.client = null;
     }

     async initialize(config) {
       if (!config.apiKey) {
         throw new Error('API key is required');
       }

       this.config = {
         apiKey: config.apiKey,
         language: config.language || 'en-US',
         ...config
       };

       this.client = new CustomClient(this.config.apiKey);
       this.initialized = true;
     }

     async startRecognition(onResult, onError) {
       if (!this.initialized) {
         throw new Error('Provider not initialized');
       }

       if (this.isRecording) {
         console.warn('Already recording');
         return;
       }

      this.onResultCallback = onResult;
      this.onErrorCallback = onError;

      try {
        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Start recognition
        this.client.startRecognition(stream, {
          onResult: (transcript) => {
            onResult(transcript);
          },
          onError: (error) => {
            onError(new Error(error));
          }
        });

        this.isRecording = true;
      } catch (error) {
        this.isRecording = false;
        onError(error);
        throw error;
      }
    }

    async stopRecognition() {
      if (!this.isRecording) {
        return;
      }

      this.isRecording = false;

      if (this.client) {
        this.client.stopRecognition();
      }
    }

    async validateConfig() {
      const errors = [];
      if (!this.config.apiKey) errors.push('API key is required');
      return {
        valid: errors.length === 0,
        errors,
        diagnostics: {
          language: this.config.language,
          hasApiKey: !!this.config.apiKey
        }
      };
    }

    getProviderInfo() {
      return {
        id: 'custom-transcription',
        name: 'Custom Transcription',
        description: 'Custom transcription provider',
        supportsContinuous: true,
        requiresApiKey: true,
        requiresLocalServer: false,
        requiresInternet: true,
        languageSupport: [
          { code: 'en-US', name: 'English (US)' },
          { code: 'zh-CN', name: 'Chinese (Mandarin)' }
        ],
        configFields: [
          { name: 'apiKey', label: 'API Key', type: 'password', required: true },
          { name: 'language', label: 'Language', type: 'select', required: false, options: ['en-US', 'zh-CN'] }
        ]
      };
    }
   }
   ```

2. **Follow same steps as AI provider** for registration, configuration, and UI updates

---

## Development Workflow

### Getting Started

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/your-assistant.git
   cd your-assistant
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run serve
   ```

4. **Open Browser**
   - Navigate to `http://localhost:8080`
   - Application will hot-reload on changes

### Development Scripts

```bash
# Start development server
npm run serve

# Start HTTPS dev server (required for microphone on mobile)
npm run serve:https

# Build for production
npm run build

# Lint with auto-fix
npm run lint

# Lint check only (no fix)
npm run lint:check

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build + run deployment smoke test
npm run test:deployment

# Start Electron desktop app (dev)
npm run electron:dev
```

### Recommended Development Tools

- **IDE**: VSCode with Volar extension
- **Browser**: Chrome DevTools for debugging
- **API Testing**: Postman or curl for testing provider APIs

---

## Testing

### Manual Testing

1. **Test Provider Switching**
   - Switch between all AI providers
   - Switch between all transcription providers
   - Verify configuration persists

2. **Test Connections**
   - Use "Test Connection" buttons
   - Verify all providers can connect

3. **Test Full Flow**
   - Start Session with different provider combinations
   - Verify transcription works
   - Verify AI responses work

4. **Test Edge Cases**
   - Invalid API keys
   - Network failures
   - Microphone permissions
   - Browser compatibility

### Diagnostic Tools

- **Web Speech API**: Open `speech-test.html` for diagnostics
- **Website Fetch Diagnostics**: Use `diagnostic_util.js` to test CORS proxies
- **Browser Console**: Check for errors and warnings
- **Network Tab**: Inspect API requests and responses

#### Using diagnostic_util.js

The `src/utils/diagnostic_util.js` module is automatically exposed on `window` in the browser. Open DevTools (F12) and run:

```javascript
// Test a specific URL against all three CORS proxies
diagnoseWebsiteFetching('https://example.com');

// Quick sanity check against example.com
quickTest();
```

The tool validates the URL for SSRF safety first, then tests each proxy individually and logs status codes, response times, content-type, and the first 200 characters of the response. Use it to identify which proxy is failing and why.

---

## Building and Deployment

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized assets.

### Deploy to GitHub Pages

1. **Build**
   ```bash
   npm run build
   ```

2. **Deploy**
   ```bash
   # Deploy dist/ folder to GitHub Pages branch
   # Or use GitHub Actions for automatic deployment
   ```

### Deployment Checklist

- [ ] Update version in package.json
- [ ] Test production build locally
- [ ] Update documentation
- [ ] Tag release in git
- [ ] Deploy to hosting

---

## Coding Standards

### JavaScript/Vue Style

- Use ES6+ features
- Follow Vue.js style guide
- Use async/await over Promises
- Use template strings over concatenation

### Component Naming

- Use PascalCase for components
- Use kebab-case for files
- Be descriptive with names

### Code Organization

- Keep components small and focused
- Extract reusable logic to utilities
- Use provider pattern for extensibility
- Separate business logic from presentation

### Error Handling

- Always handle async errors
- Provide user-friendly error messages
- Log errors to console with context
- Validate user input

### Comments

- Document complex logic
- Explain why, not what
- Use JSDoc for functions
- Keep comments up to date

---

## Contributing

### How to Contribute

1. **Fork Repository**
   - Create your own fork

2. **Create Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow coding standards
   - Add tests if applicable
   - Update documentation

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new provider X"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   - Create pull request on GitHub
   - Describe your changes

### Commit Message Convention

Use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add support for new AI provider
fix: resolve memory leak in transcription
docs: update provider setup guide
refactor: simplify provider registry
```

### Pull Request Guidelines

- **Title**: Use conventional commit format
- **Description**: Explain what and why
- **Testing**: Describe how you tested
- **Screenshots**: Add for UI changes
- **Documentation**: Update relevant docs

### Code Review Process

1. **Automated Checks**
   - Linting passes
   - Build succeeds
   - Tests pass (when implemented)

2. **Manual Review**
   - Code quality
   - Architecture decisions
   - Documentation completeness
   - Breaking changes

---

## Resources

### Documentation
- [Vue.js Documentation](https://vuejs.org/)
- [Element UI Documentation](https://element.eleme.io/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [Azure Speech SDK](https://docs.microsoft.com/azure/cognitive-services/speech-service/)

### Provider APIs
- [OpenAI API](https://platform.openai.com/docs)
- [Anthropic API](https://docs.anthropic.com)
- [Z.ai API](https://z.ai)
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Deepgram API](https://developers.deepgram.com)

### Community
- [GitHub Issues](https://github.com/your-repo/your-assistant/issues)
- [GitHub Discussions](https://github.com/your-repo/your-assistant/discussions)

---

## Troubleshooting Development Issues

### Common Problems

**Hot Reload Not Working**
- Restart dev server
- Clear browser cache
- Check file watchers are working

**Build Failures**
- Check Node.js version (use LTS)
- Delete `node_modules` and reinstall
- Clear npm cache: `npm cache clean --force`

**Provider Not Showing in Settings**
- Check provider is registered in registry
- Verify import paths are correct
- Check browser console for errors

**API Requests Failing in Development**
- Check CORS settings
- Verify API credentials
- Check browser console for errors
- Use browser Network tab for debugging

---

For more information:
- [README](../README.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Provider Comparison](./PROVIDER_COMPARISON.md)

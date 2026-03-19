# Your Assistant Architecture Guide

This document provides a comprehensive overview of the Your Assistant architecture, including design patterns, provider system, and key architectural decisions.

## Table of Contents

- [Core Architecture](#core-architecture)
- [Provider System](#provider-system)
- [State Management](#state-management)
- [Mobile Support](#mobile-support)
- [Configuration System](#configuration-system)
- [Error Handling](#error-handling)
- [Performance Optimizations](#performance-optimizations)
- [Security Considerations](#security-considerations)

## Core Architecture

### Vue 3 Composition API

Your Assistant is built using Vue 3 with the Composition API (`<script setup>` syntax). This provides better TypeScript support, improved code organization, and more flexible composition patterns.

**Key Benefits:**
- Better code organization and reusability
- Improved TypeScript support
- More flexible composition patterns
- Better performance through tree-shaking

### Provider Abstraction Pattern

The application uses a sophisticated provider abstraction pattern that allows for easy extensibility and maintainability.

**Architecture Components:**

1. **Base Provider Classes**
   - `BaseAIProvider` - Abstract base for all AI providers
   - `BaseTranscriptionProvider` - Abstract base for all transcription providers

2. **Provider Registries**
   - `providerRegistry` - Manages AI providers
   - `transcriptionRegistry` - Manages transcription providers

3. **Provider Implementations**
   - Individual provider classes with specific implementations
   - Consistent interface across all providers

4. **Configuration Layer**
   - Centralized configuration management
   - localStorage-based persistence

### Multi-Provider Architecture

The application supports multiple providers for both AI and transcription services:

**AI Providers:**
- OpenAI (GPT-3.5, GPT-4, GPT-4 Turbo)
- Z.ai (GLM-4 series models)
- Ollama (Local models)
- MLX (Apple Silicon optimized)
- Anthropic (Claude 3 models)

**Transcription Providers:**
- Azure Speech Service
- OpenAI Whisper
- Web Speech API
- Deepgram

## Provider System

### Base Provider Classes

#### BaseAIProvider

The `BaseAIProvider` class provides a comprehensive foundation for all AI providers with the following features:

```javascript
class BaseAIProvider {
  // Core methods
  async initialize(config) // Initialize provider
  async generateCompletion(prompt, options) // Non-streaming
  async generateCompletionStream(prompt, onChunk, options) // Streaming
  async validateConfig() // Validate configuration
  getProviderInfo() // Get provider metadata
  
  // Advanced features
  async executeWithRetry(fn, options) // Retry logic with exponential backoff
  async executeWithTimeout(fn, timeoutMs, errorMessage) // Timeout handling
  createTimeoutController(timeoutMs) // Abort controller with timeout
  testConnection() // Connection testing
}
```

**Key Features:**
- **Retry Logic**: Automatic retry with exponential backoff for network failures
- **Timeout Handling**: Configurable timeouts with AbortController support
- **Error Classification**: Distinguishes between retryable and non-retryable errors
- **Connection Testing**: Built-in connection validation
- **Streaming Support**: Consistent streaming interface across all providers

#### BaseTranscriptionProvider

The `BaseTranscriptionProvider` class provides the foundation for transcription providers:

```javascript
class BaseTranscriptionProvider {
  // Core methods
  async initialize(config) // Initialize provider
  async startRecognition(onResult, onError) // Start recognition
  async stopRecognition() // Stop recognition
  isRecognizing() // Check if recording
  validateConfig() // Validate configuration
  checkBrowserSupport() // Browser compatibility
  getProviderInfo() // Get provider metadata
}
```

### Provider Registration System

Providers are registered through a centralized registry system:

```javascript
// AI Provider Registry
class ProviderRegistry {
  registerDefaultProviders() {
    this.register(new OpenAIProvider());
    this.register(new ZaiProvider());
    this.register(new OllamaProvider());
    this.register(new MLXProvider());
    this.register(new AnthropicProvider());
  }
}

// Transcription Provider Registry
class TranscriptionRegistry {
  registerDefaultProviders() {
    this.register(new AzureTranscriptionProvider());
    this.register(new WhisperTranscriptionProvider());
    this.register(new WebSpeechTranscriptionProvider());
    this.register(new DeepgramTranscriptionProvider());
  }
}
```

### Provider-Specific Implementations

Each provider implements the base interface with provider-specific logic:

#### OpenAI Provider
- Uses official OpenAI SDK
- Supports all OpenAI models (GPT-3.5, GPT-4, etc.)
- Implements retry logic for API failures
- Handles streaming responses with SSE parsing

#### Z.ai Provider
- Uses REST API with OpenAI-compatible format
- Supports GLM-4 series models
- Includes comprehensive error handling and troubleshooting
- Provides fallback to non-streaming mode on network failures

#### Ollama Provider
- Local model execution via HTTP API
- No API key required
- Supports multiple model types (Llama2, Mistral, etc.)
- Includes model discovery from local server

#### MLX Provider
- Apple Silicon optimized local inference
- Requires MLX framework installation
- Similar interface to Ollama but optimized for Apple hardware

#### Anthropic Provider
- Claude 3 model support (Haiku, Sonnet, Opus)
- Uses Anthropic's Messages API
- Implements streaming with SSE parsing
- Includes timeout and retry logic

## State Management

### localStorage-Based Configuration

The application uses localStorage for all configuration persistence, making it completely serverless:

```javascript
// Configuration functions in config_util.js
function openai_api_key() {
  return localStorage.getItem("openai_key")
}

function gpt_model() {
  return localStorage.getItem("gpt_model") || "gpt-3.5-turbo"
}

// All configuration is stored locally, no backend required
```

**Configuration Categories:**
- AI Provider Settings (API keys, models, endpoints)
- Transcription Provider Settings (API keys, languages, regions)
- System Settings (temperature, timeouts, preferences)

### Session State Management

#### Desktop Session Management
- Transient state (transcripts, AI responses)
- No persistent session storage
- State resets on page refresh

#### Mobile Session Persistence
- Automatic session saving every 5 seconds during active sessions
- Session restoration on page load (within 1 hour)
- Prevents auto-activation on iOS Safari
- Handles session truncation for memory management

```javascript
// Mobile session management
const saveMobileSession = () => {
  if (!isMobile.value) return
  
  const session = {
    currentText: currentText.value,
    aiResult: ai_result.value,
    conversationHistory: conversationHistory.value,
    timestamp: Date.now(),
    state: state.value
  }
  localStorage.setItem(MOBILE_SESSION_KEY, JSON.stringify(session))
}
```

### Conversation History Management

The application implements a rolling conversation history system:

```javascript
// Rolling history compaction
const compactHistory = async (question, answer) => {
  // Summarizes Q&A exchanges into bullet points
  // Maintains context while managing memory usage
  // Uses the same AI provider for consistency
}
```

**Features:**
- Automatic history summarization
- Memory management for long conversations
- Provider-consistent summarization
- Fallback to simple concatenation if AI summarization fails

## Mobile Support

### Device Detection and Responsive Design

The application includes comprehensive mobile support:

```javascript
// Mobile detection composable
export function useMobile() {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(false)
  const breakpoint = 768
  const tabletBreakpoint = 1024

  const checkDevice = () => {
    const width = window.innerWidth
    isMobile.value = width < breakpoint
    isTablet.value = width >= breakpoint && width < tabletBreakpoint
    isDesktop.value = width >= tabletBreakpoint
  }
}
```

### Mobile-Specific Optimizations

#### Touch-Friendly Interface
- Larger touch targets (44px minimum)
- Optimized button spacing
- Prevents double-tap zoom issues
- Touch action optimization

#### Mobile Layout Adaptations
- Tab-based navigation for mobile
- Single-column layout on small screens
- Fixed action bar at bottom
- Proper safe area handling for notched devices

#### Mobile Performance Optimizations
- Platform-specific memory limits
- Optimized scrolling with `-webkit-overflow-scrolling`
- Reduced context limits for mobile devices
- Efficient session persistence

### iOS Safari Specific Handling

The application includes extensive iOS Safari compatibility:

```javascript
// iOS Safari detection and handling
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

// Special handling for iOS microphone access
if (isIOS && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
  // Use explicit microphone access
  this.microphoneStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 16000
    }
  })
}
```

**iOS-Specific Features:**
- Explicit microphone permission handling
- WebSocket fallbacks for streaming
- Prevents auto-activation issues
- Optimized for iOS Safari limitations

## Configuration System

### Centralized Configuration Management

All configuration is managed through the `config_util.js` file:

```javascript
// Configuration pattern
function provider_setting_name() {
    return localStorage.getItem("storage_key") || "default_value"
}

// Usage in components
import config from '@/utils/config_util'
const apiKey = config.openai_api_key()
```

### Configuration Categories

#### AI Provider Configuration
- **OpenAI**: API key, model selection, temperature
- **Z.ai**: API key, model, endpoint URL
- **Ollama**: Local endpoint, model selection
- **MLX**: Local endpoint, model selection
- **Anthropic**: API key, model selection

#### Transcription Provider Configuration
- **Azure**: Subscription key, region, language
- **Whisper**: API key, model, language
- **Web Speech**: Language, continuous mode, interim results
- **Deepgram**: API key, model, language

#### System Configuration
- **Temperature settings**: Per-provider temperature control
- **Language settings**: Global and provider-specific language options
- **Endpoint configuration**: Custom endpoint support for local providers

### Configuration Validation

Each provider includes comprehensive configuration validation:

```javascript
async validateConfig() {
  const errors = []
  
  if (!this.config.apiKey) {
    errors.push('API key is required')
  }
  
  if (this.config.apiKey && !this.config.apiKey.startsWith('sk-')) {
    errors.push('API key should start with "sk-"')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    diagnostics: {
      hasApiKey: !!this.config.apiKey,
      model: this.config.model
    }
  }
}
```

## Error Handling

### Comprehensive Error Handling Strategy

The application implements a multi-layered error handling approach:

#### Provider-Level Error Handling
- **Network Errors**: Automatic retry with exponential backoff
- **API Errors**: Specific error messages with troubleshooting guidance
- **Validation Errors**: Clear configuration validation feedback
- **Timeout Errors**: Configurable timeouts with graceful degradation

#### User-Friendly Error Messages
- **Contextual Errors**: Errors include specific troubleshooting steps
- **Provider-Specific Guidance**: Tailored error messages for each provider
- **Fallback Mechanisms**: Graceful degradation when possible

#### Error Recovery
- **Streaming Recovery**: Automatic reconnection for streaming failures
- **Provider Fallbacks**: Alternative providers when primary fails
- **Session Recovery**: Mobile session restoration on errors

### Error Classification

```javascript
// Retryable vs Non-retryable errors
isRetryableError(error) {
  // Network errors
  if (error.message.includes('Failed to fetch') ||
      error.message.includes('Network error') ||
      error.message.includes('ECONNRESET') ||
      error.message.includes('ETIMEDOUT')) {
    return true
  }

  // HTTP status codes that are retryable
  if (error.message.includes('429') || // Rate limit
      error.message.includes('503') || // Service unavailable
      error.message.includes('502') || // Bad gateway
      error.message.includes('504')) { // Gateway timeout
    return true
  }

  return false
}
```

## Performance Optimizations

### Memory Management

#### Transcript Length Management
- **Desktop**: 15,000 character limit
- **Mobile**: 10,000 character limit (optimized for mobile performance)
- **Automatic Truncation**: Removes oldest content when limits exceeded
- **Incremental Processing**: Only processes new transcript content

#### AI Response Length Management
- **Desktop**: 50,000 character limit
- **Mobile**: 30,000 character limit
- **Streaming Optimization**: Real-time content display during generation
- **Response Truncation**: Graceful handling of long responses

#### Context Management
- **Platform-Specific Limits**: Desktop (100k chars), Mobile (50k chars)
- **Smart Summarization**: Automatic context summarization when limits exceeded
- **Pre-prepared Context**: Instant session responses with cached context

### Streaming Optimizations

#### Streaming Recovery System
```javascript
const executeWithStreamingRecovery = async (streamFn, onChunk, onError, onComplete) => {
  streamingState.value.isActive = true
  streamingState.value.reconnectAttempts = 0

  const attemptStream = async () => {
    try {
      await streamFn((chunk) => {
        streamingState.value.lastChunkTime = Date.now()
        onChunk(chunk)
      })
      // Success handling
    } catch (error) {
      if (streamingState.value.reconnectAttempts < streamingState.value.maxReconnectAttempts) {
        // Retry logic
      } else {
        // Final error handling
      }
    }
  }
}
```

#### Real-time Updates
- **Incremental Processing**: Only processes new transcript content
- **Streaming Cursor**: Visual feedback during AI response generation
- **Auto-scrolling**: Smooth scrolling during content updates

### Mobile Performance Optimizations

#### Platform-Specific Limits
- **Reduced Memory Usage**: Lower limits for mobile devices
- **Optimized Scrolling**: Hardware-accelerated scrolling
- **Touch Optimization**: Larger touch targets and optimized interactions

#### Session Persistence Optimization
- **Incremental Saving**: Only saves during active sessions
- **Session Truncation**: Automatic cleanup of old session data
- **Memory Management**: Prevents memory leaks on mobile devices

## Security Considerations

### API Key Security
- **Local Storage Only**: API keys stored only in browser localStorage
- **No Backend Transmission**: Keys never sent to any server except specified providers
- **Secure Transmission**: All API calls use HTTPS
- **Input Validation**: Comprehensive URL validation with SSRF protection

#### SSRF Protection

All user-supplied URLs pass through two validation layers before any network request is made:

```javascript
// 1. isValidUrl — rejects non-http(s) schemes
// 2. isSafeUrl  — blocks private/loopback ranges
if (!isValidUrl(url) || !isSafeUrl(url)) {
  throw new Error('Access to internal/private network resources is not allowed');
}
```

**Blocked URL patterns:**
- `localhost`, `0.0.0.0`, `::1` (loopback/unspecified)
- Full `127.0.0.0/8` loopback range
- Private IPv4 ranges: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
- Link-local / AWS metadata range: `169.254.0.0/16`
- Non-decimal IP encodings (octal, hex, decimal integer)
- IPv4-mapped IPv6 (`::ffff:...`) and private IPv6 (`fc00::/7`)
- Non-`http:`/`https:` protocols

Both `fetchWebsiteToMarkdown` (internal) and `validateWebsiteUrl` (exported, used by UI components) enforce these checks, so the guard applies at every call site.

The `diagnostic_util.js` tool applies the same validation via its own `validateUrl` helper before issuing any diagnostic fetch.

#### CORS and Security Headers
- **CORS Proxy Fallbacks**: Built-in CORS proxy support for mobile networks
- **Security Headers**: Proper Content-Type and security headers
- **Input Sanitization**: URL and input validation

### Privacy Considerations
- **No Data Collection**: Application doesn't collect or store user data
- **Provider Isolation**: Data only sent to user-selected providers
- **Local Processing**: All configuration and session data stays local
- **Clear Data**: Users can clear all data through browser settings

## Composables

### useOverlayMode

Manages the mini/overlay mode with two strategies, tried in order:

1. **Document Picture-in-Picture** (Chrome 116+) — opens a true floating window via `window.documentPictureInPicture.requestWindow()`. Styles are cloned from the main document into the PiP window. When the user closes the PiP window the `pagehide` event moves the content element back to the main document.

2. **CSS overlay fallback** — when PiP is unsupported or fails, sets `isMiniMode = true` which triggers a CSS fixed-position overlay inside the same tab.

```javascript
import { toggleOverlayMode, overlayState, registerOverlayShortcut } from '@/composables/useOverlayMode';

// overlayState.isOverlayMode — readonly ref, true when in overlay mode
// overlayState.isPiPActive — readonly ref, true only when real PiP window is open

// Register Alt+M / Cmd+M global shortcut (call once in App.vue onMounted)
const cleanup = registerOverlayShortcut(() => toggleOverlayMode(contentEl));
onUnmounted(cleanup);
```

**Key exports:**
- `toggleOverlayMode(contentEl)` — enter or exit overlay mode
- `isPiPSupported()` — returns `true` if Document PiP API is available
- `registerOverlayShortcut(fn)` — binds Alt+M / Cmd+M, returns cleanup function
- `overlayState` — `{ isOverlayMode: readonly ref, isPiPActive: readonly ref }`

Module-level singleton state means all components share the same overlay status.

---

## Development Architecture

### Component Structure
- **Main Views**: HomeView.vue (main interface), settings views under `views/settings/`
- **Components**: Reusable Vue components (LoadingIcon, MyTimer, MarkdownViewer, OverlayPanel)
- **Composables**: `useAutoMode`, `useElectron`, `useMobile`, `useOverlayMode`
- **Services**: Provider implementations and business logic
- **Utilities**: Helper functions and configuration management

### Build and Deployment
- **Vue CLI**: Standard Vue 3 build process
- **Static Hosting**: No backend required, deployable to any static hosting
- **PWA Ready**: Manifest.json included for PWA functionality
- **HTTPS Required**: Some features require HTTPS (microphone access)

### Testing Strategy
- **Manual Testing**: Comprehensive manual testing for provider combinations
- **Diagnostic Tools**: Built-in diagnostic tools for troubleshooting
- **Browser Console**: Extensive logging for debugging
- **Connection Testing**: Built-in connection validation for all providers

This architecture provides a robust, extensible, and user-friendly foundation for the Your Assistant application while maintaining excellent performance and security standards.
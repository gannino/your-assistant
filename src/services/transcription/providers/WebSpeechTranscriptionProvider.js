/**
 * WebSpeechTranscriptionProvider - Browser Built-in Speech Recognition
 *
 * Uses the Web Speech API (SpeechRecognition) built into modern browsers.
 * No API key required. NOTE: Chrome/Edge use Google's online service and require internet.
 */

import DOMPurify from 'dompurify';
import { BaseTranscriptionProvider } from '../BaseTranscriptionProvider';

export class WebSpeechTranscriptionProvider extends BaseTranscriptionProvider {
  constructor() {
    super({});
    this.recognition = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Initialize the Web Speech provider with configuration
   * @param {Object} config - Configuration object
   * @param {string} config.language - Language code (default: 'en-US')
   * @param {boolean} config.continuous - Continuous mode (default: true)
   * @param {boolean} config.interimResults - Show interim results (default: false)
   */
  async initialize(config) {
    // Check for iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isElectron = window.electronAPI?.isElectron;
    // Edge detection: Desktop (Chromium-based) vs Mobile (iOS uses WebKit, Android uses Chromium)
    const isEdgeDesktop =
      /Edg/.test(navigator.userAgent) &&
      !/Mobile|Android|iPhone|iPad|iPod/.test(navigator.userAgent);
    const isEdgeMobileiOS = /EdgiOS/.test(navigator.userAgent); // Edge on iOS uses WebKit (Safari)
    const isEdgeMobileAndroid = /EdgA/.test(navigator.userAgent); // Edge on Android uses Chromium
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);

    console.log('[Web Speech Transcription] Environment:', {
      isIOS,
      isElectron,
      isEdgeDesktop,
      isEdgeMobileiOS,
      isEdgeMobileAndroid,
      isChrome,
      userAgent: navigator.userAgent,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
    });

    // Warn about Edge Desktop
    if (isEdgeDesktop) {
      console.warn('[Web Speech Transcription] ⚠️ Microsoft Edge Desktop detected');
      console.warn('[Web Speech Transcription] Web Speech API is not supported in Edge Desktop');
      console.warn('[Web Speech Transcription] For Web Speech API, use Chrome desktop browser');
      console.warn(
        '[Web Speech Transcription] Or use Azure, Deepgram, or Whisper provider (works in any browser)'
      );
    }

    // Warn about Edge Mobile Android
    if (isEdgeMobileAndroid) {
      console.warn('[Web Speech Transcription] ⚠️ Microsoft Edge Mobile (Android) detected');
      console.warn(
        '[Web Speech Transcription] Web Speech API may not work in Edge Mobile on Android'
      );
      console.warn('[Web Speech Transcription] For Web Speech API on Android, use Chrome browser');
      console.warn(
        '[Web Speech Transcription] Or use Azure, Deepgram, or Whisper provider (works in any browser)'
      );
    }

    // Note about Edge iOS
    if (isEdgeMobileiOS) {
      console.log(
        '[Web Speech Transcription] ℹ️ Microsoft Edge iOS detected (uses WebKit - should work like Safari)'
      );
    }

    // Warn about Electron
    if (isElectron) {
      console.warn('[Web Speech Transcription] ⚠️ Electron detected');
      console.warn('[Web Speech Transcription] Web Speech API is not supported in Electron');
      console.warn(
        '[Web Speech Transcription] For Web Speech API, use Chrome web browser instead of this app'
      );
      console.warn(
        '[Web Speech Transcription] Or use Azure, Deepgram, or Whisper provider (works in Electron)'
      );
    }

    if (isIOS) {
      console.warn('[Web Speech Transcription] iOS Safari detected - limited support');

      // iOS Safari doesn't support continuous mode well
      if (config.continuous === true) {
        console.warn('[Web Speech Transcription] Disabling continuous mode for iOS compatibility');
      }
    }

    this.config = {
      language: config.language || 'en-US',
      continuous: isIOS ? false : config.continuous !== undefined ? config.continuous : true,
      interimResults: config.interimResults || false,
      ...config,
    };

    // Get SpeechRecognition constructor (browser-specific)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error(
        'SpeechRecognition not supported in this browser. Please use Chrome, Edge, or Safari 14.1+'
      );
    }

    // Test if getSupportedConstraints exists (iOS Safari issue)
    if (
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getSupportedConstraints === 'function'
    ) {
      try {
        // getSupportedConstraints returns a plain object synchronously, not a Promise
        const constraints = navigator.mediaDevices.getSupportedConstraints();
        console.log('[Web Speech Transcription] Supported constraints:', constraints);
      } catch (e) {
        console.warn('[Web Speech Transcription] getSupportedConstraints check failed:', e.message);
        // Continue anyway, this isn't critical
      }
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = this.config.language;
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;

      this.initialized = true;
      console.log('[Web Speech Transcription] Initialized with language:', this.config.language);

      if (isIOS) {
        console.warn(
          '[Web Speech Transcription] iOS Safari: Speech recognition may stop after ~60 seconds. This is a browser limitation.'
        );
      }
    } catch (error) {
      console.error('[Web Speech Transcription] Failed to create SpeechRecognition:', error);
      throw new Error(
        `Failed to initialize speech recognition: ${error.message}. iOS Safari has limited Web Speech API support. Consider using Azure, Whisper, or Deepgram providers instead.`
      );
    }
  }

  /**
   * Start continuous speech recognition
   * @param {Function} onResult - Callback(transcript) for each result
   * @param {Function} onError - Callback(error) for errors
   */
  async startRecognition(onResult, onError) {
    if (!this.initialized) {
      throw new Error('Web Speech provider not initialized. Call initialize() first.');
    }

    if (this.isRecording) {
      console.warn('[Web Speech Transcription] Already recording');
      return;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.retryCount = 0;

    // Check if we're on iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
      console.warn('[Web Speech Transcription] iOS Safari detected - may have limited support');
      // iOS Safari doesn't support continuous mode
      if (this.recognition.continuous === true) {
        this.recognition.continuous = false;
        console.log('[Web Speech Transcription] Disabled continuous mode for iOS');
      }
    }

    this.setupRecognitionHandlers();

    try {
      this.recognition.start();
      this.isRecording = true;
      console.log('[Web Speech Transcription] Started recognition successfully');
      console.log('[Web Speech Transcription] Config:', {
        language: this.recognition.lang,
        continuous: this.recognition.continuous,
        interimResults: this.recognition.interimResults,
      });
    } catch (error) {
      this.isRecording = false;
      console.error('[Web Speech Transcription] Error starting recognition:', error);
      console.error('[Web Speech Transcription] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      this.handleError(error, onError);
      throw error;
    }
  }

  /**
   * Setup recognition event handlers
   */
  setupRecognitionHandlers() {
    this.recognition.onresult = event => {
      let transcript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal || this.config.interimResults) {
          transcript += result[0].transcript;
        }
      }

      if (transcript && transcript.trim().length > 0) {
        this.onResultCallback(DOMPurify.sanitize(transcript));
        // Reset retry count on successful result
        this.retryCount = 0;
      }
    };

    this.recognition.onerror = event => {
      console.error('[Web Speech Transcription] Error:', event.error);

      // Handle specific error types
      if (event.error === 'network') {
        // Network error - service unreachable or no internet
        // Stop recording - network errors won't be resolved by retrying
        this.isRecording = false;
        this.retryCount = this.maxRetries; // Prevent onend from restarting

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isElectron = window.electronAPI?.isElectron;
        const isEdgeDesktop =
          /Edg/.test(navigator.userAgent) &&
          !/Mobile|Android|iPhone|iPad|iPod/.test(navigator.userAgent);
        const isEdgeMobileAndroid = /EdgA/.test(navigator.userAgent);

        // Log detailed diagnostics
        console.error('[Web Speech Transcription] Network error diagnostics:', {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          protocol: window.location.protocol,
          hostname: window.location.hostname,
          port: window.location.port,
          isIOS,
          isElectron,
          isEdgeDesktop,
          isEdgeMobileAndroid,
          timestamp: new Date().toISOString(),
        });
        console.error(
          '[Web Speech Transcription] Check DevTools Network tab for failed requests to Google domains'
        );

        let errorMessage = 'Speech recognition service unavailable.';

        if (isEdgeDesktop) {
          errorMessage +=
            '\n\n⚠️ Microsoft Edge Desktop detected.\n\n' +
            'Web Speech API is not supported in Edge Desktop.\n' +
            'For Web Speech API, use Chrome desktop browser instead.\n\n' +
            'Or use these providers (work in any browser):\n' +
            '• Azure Speech (5 free hours/month)\n' +
            '• Deepgram (200 free hours/month)\n' +
            '• OpenAI Whisper (paid API)\n\n' +
            'Go to Settings → Speech → Transcription Provider to change.';
        } else if (isEdgeMobileAndroid) {
          errorMessage +=
            '\n\n⚠️ Microsoft Edge Mobile (Android) detected.\n\n' +
            'Web Speech API may not work in Edge on Android.\n' +
            'For Web Speech API on Android, use Chrome browser instead.\n\n' +
            'Or use these providers (work in any browser):\n' +
            '• Azure Speech (5 free hours/month)\n' +
            '• Deepgram (200 free hours/month)\n' +
            '• OpenAI Whisper (paid API)\n\n' +
            'Go to Settings → Speech → Transcription Provider to change.';
        } else if (isElectron) {
          errorMessage +=
            '\n\n⚠️ Electron desktop app detected.\n\n' +
            'Web Speech API is not supported in Electron.\n\n' +
            'For Web Speech API, use Chrome web browser instead of this app.\n\n' +
            'Or use these providers (work in Electron):\n' +
            '• Azure (5 free hours/month)\n' +
            '• Deepgram (200 free hours/month)\n' +
            '• Whisper (local, requires Python setup)\n\n' +
            'Go to Settings → Speech → Transcription Provider to change.';
        } else if (isIOS) {
          errorMessage +=
            '\n\n⚠️ iOS Safari detected.\n' +
            'Web Speech API has limited support on iOS.\n' +
            'Consider using Azure, Whisper, or Deepgram for better reliability.';
        } else {
          errorMessage +=
            '\n\nThis usually means:\n' +
            "1. No internet connection (Chrome uses Google's servers)\n" +
            '2. VPN or firewall blocking the service\n' +
            '3. Google speech service is down\n\n' +
            'Try: Check your internet, disable VPN, or use a different transcription provider.';
        }

        const error = new Error(errorMessage);
        this.handleError(error, this.onErrorCallback);
        return;
      }

      if (event.error === 'not-allowed') {
        // Microphone permission denied
        this.isRecording = false;
        this.retryCount = this.maxRetries; // Prevent onend from restarting

        const error = new Error(
          'Microphone permission denied. ' +
            'Please allow microphone access in your browser settings.\n\n' +
            'On iOS: Settings > Safari > Microphone\n' +
            'On Android: Chrome Settings > Site Settings > Microphone'
        );
        this.handleError(error, this.onErrorCallback);
        return;
      }

      // 'no-speech' is common and not really an error
      if (event.error === 'no-speech') {
        console.log('[Web Speech Transcription] No speech detected');
        return;
      }

      // For other errors, try to restart if it's an abort
      if (event.error === 'aborted' && this.isRecording && this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(
          '[Web Speech Transcription] Retrying... (' + this.retryCount + '/' + this.maxRetries + ')'
        );
        setTimeout(() => {
          if (this.isRecording) {
            try {
              this.recognition.start();
            } catch {
              // Already started or stopped
            }
          }
        }, this.retryDelay);
        return;
      }

      // For other errors, report them and stop
      if (event.error !== 'aborted') {
        this.isRecording = false;
        this.retryCount = this.maxRetries; // Prevent onend from restarting
        if (this.onErrorCallback) {
          const sanitizedError = String(event.error).replace(/[<>"'&]/g, '');
          this.handleError(
            new Error('Speech recognition error: ' + sanitizedError),
            this.onErrorCallback
          );
        }
      }
    };

    this.recognition.onend = () => {
      if (this.isRecording && this.retryCount < this.maxRetries) {
        // Restart if still supposed to be recording
        console.log('[Web Speech Transcription] Auto-restarting...');
        try {
          this.recognition.start();
        } catch {
          // Already started or stopped
        }
      } else if (this.isRecording) {
        // Max retries reached, stop recording
        console.warn('[Web Speech Transcription] Max retries reached, stopping');
        this.isRecording = false;
      }
    };
  }

  /**
   * Handle errors with optional callback
   */
  handleError(error, onError) {
    if (onError) {
      onError(error);
    }
  }

  /**
   * Stop continuous speech recognition
   */
  async stopRecognition() {
    if (!this.isRecording) {
      console.warn('[Web Speech Transcription] Not recording');
      return;
    }

    this.isRecording = false;
    this.retryCount = this.maxRetries; // Prevent auto-restart

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.error('Error stopping speech recognition:', e);
        this.isRecording = false;
        this.recognition = null;
      }
    }
  }

  /**
   * Validate the Web Speech configuration
   */
  async validateConfig() {
    const errors = [];
    const warnings = [];

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isElectron = window.electronAPI?.isElectron;
    const isEdgeDesktop =
      /Edg/.test(navigator.userAgent) &&
      !/Mobile|Android|iPhone|iPad|iPod/.test(navigator.userAgent);
    const isEdgeMobileAndroid = /EdgA/.test(navigator.userAgent);

    // Add error for Edge Desktop - it's not supported
    if (isEdgeDesktop) {
      errors.push(
        'Web Speech API is NOT supported in Edge Desktop. For Web Speech API, use Chrome desktop browser. Or use Azure, Deepgram, or Whisper provider (works in any browser).'
      );
    }

    // Add warning for Edge Mobile Android - may not work
    if (isEdgeMobileAndroid) {
      warnings.push(
        'Web Speech API may not work in Edge on Android. For Web Speech API on Android, use Chrome browser. Or use Azure, Deepgram, or Whisper provider (works in any browser).'
      );
    }

    // Add error for Electron - it's not supported
    if (isElectron) {
      errors.push(
        'Web Speech API is NOT supported in Electron. For Web Speech API, use Chrome web browser. Or use Azure, Deepgram, or Whisper provider (works in Electron).'
      );
    }

    // Add warning for iOS - limited support
    if (isIOS) {
      warnings.push(
        'iOS Safari has limited Web Speech API support. Consider using Azure, Whisper, or Deepgram providers for better reliability.'
      );
    }

    if (this.config.language && !/^[a-z]{2}-[A-Z]{2}$/.test(this.config.language)) {
      errors.push('Language must be in format: en-US, zh-CN, etc.');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      errors.push(
        'SpeechRecognition not supported in this browser (requires Chrome or Safari 14.1+)'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      diagnostics: {
        language: this.config.language,
        continuous: this.config.continuous,
        browserSupported: !!SpeechRecognition,
        isIOS,
        isEdgeDesktop,
        isEdgeMobileAndroid,
        isElectron,
      },
    };
  }

  /**
   * Check browser support
   */
  checkBrowserSupport() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Get provider metadata
   */
  getProviderInfo() {
    const isSupported = this.checkBrowserSupport();
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isEdgeDesktop =
      /Edg/.test(navigator.userAgent) &&
      !/Mobile|Android|iPhone|iPad|iPod/.test(navigator.userAgent);
    const isEdgeMobileiOS = /EdgiOS/.test(navigator.userAgent);
    const isElectron = window.electronAPI?.isElectron;

    let description;
    if (isElectron) {
      description =
        '⚠️ NOT SUPPORTED in Electron. For Web Speech API, use Chrome web browser. Or use Azure, Deepgram, or Whisper provider (works in Electron).';
    } else if (isEdgeDesktop) {
      description =
        '⚠️ NOT SUPPORTED in Edge Desktop. For Web Speech API, use Chrome desktop browser. Or use Azure, Deepgram, or Whisper provider (works in any browser).';
    } else if (isSupported) {
      if (isIOS || isEdgeMobileiOS) {
        description =
          'Browser built-in speech recognition (FREE, no API key). iOS Safari has limited support - may stop after ~60 seconds.';
      } else {
        description =
          'Browser built-in speech recognition (FREE, no API key). Requires internet connection in Chrome.';
      }
    } else {
      description = 'Not supported in this browser (requires Chrome or Safari 14.1+)';
    }

    return {
      id: 'webspeech',
      name: 'Web Speech API',
      description,
      supportsContinuous: !(isIOS || isEdgeMobileiOS), // iOS doesn't support true continuous mode
      requiresApiKey: false,
      requiresLocalServer: false,
      requiresInternet: true,
      browserSupport: 'chrome-safari',
      edgeDesktopSupport: 'not-supported',
      edgeMobileiOSSupport: 'supported',
      iosSupport: 'limited',
      electronSupport: 'not-supported',
      documentationUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition',
      configFields: [
        {
          name: 'language',
          label: 'Language',
          type: 'select',
          required: false,
          options: ['en-US', 'zh-CN', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR'],
        },
        {
          name: 'continuous',
          label: 'Continuous Mode',
          type: 'checkbox',
          required: false,
          disabled: isIOS || isEdgeMobileiOS,
        },
        {
          name: 'interimResults',
          label: 'Show Interim Results',
          type: 'checkbox',
          required: false,
        },
      ],
      languageSupport: [
        { code: 'en-US', name: 'English (US)' },
        { code: 'en-GB', name: 'English (UK)' },
        { code: 'zh-CN', name: 'Chinese (Mandarin)' },
        { code: 'es-ES', name: 'Spanish' },
        { code: 'fr-FR', name: 'French' },
        { code: 'de-DE', name: 'German' },
        { code: 'ja-JP', name: 'Japanese' },
        { code: 'ko-KR', name: 'Korean' },
      ],
      troubleshooting: [
        '⚠️ Edge Desktop? Web Speech API is NOT supported. Use Chrome browser for Web Speech, or use Azure/Deepgram/Whisper providers.',
        '⚠️ Electron app? Web Speech API is NOT supported. Use Chrome web browser for Web Speech, or use Azure/Deepgram/Whisper providers.',
        'Using iPhone/iPad or Edge iOS? Consider using Azure or Whisper provider for better iOS support',
        'Network error in Chrome? Check your internet connection',
        'Using VPN? Try disabling it',
        'Microphone blocked? Allow microphone access in browser settings',
        'iOS Safari/Edge iOS: Web Speech may stop after 60 seconds - this is a browser limitation',
        'Still not working? Try Azure, Whisper, or Deepgram providers instead',
      ],
    };
  }
}

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
        // This API might not exist on iOS, but check safely
        navigator.mediaDevices.getSupportedConstraints({ audio: true }).catch(() => {
          // Ignore errors from this optional check
        });
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
      console.log('[Web Speech Transcription] Started recognition');
    } catch (error) {
      this.isRecording = false;
      console.error('[Web Speech Transcription] Error starting recognition:', error);
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

        const error = new Error(
          'Speech recognition service unavailable. ' +
            (isIOS
              ? '\n\niOS Safari Note: Web Speech API has limited support on iOS. ' +
                'Consider using the Azure, Whisper, or Deepgram provider for better reliability.'
              : '\n\nThis usually means:\n' +
                "1. No internet connection (Chrome uses Google's servers)\n" +
                '2. VPN or firewall blocking the service\n' +
                '3. Google speech service is down\n\n' +
                'Try: Check your internet, disable VPN, or use a different transcription provider.')
        );
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
            } catch (e) {
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
        } catch (e) {
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
        // Already stopped
      }
    }

    console.log('[Web Speech Transcription] Stopped recognition');
  }

  /**
   * Validate the Web Speech configuration
   */
  async validateConfig() {
    const errors = [];
    const warnings = [];

    // Check for iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

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
        'SpeechRecognition not supported in this browser (requires Chrome, Edge, or Safari 14.1+)'
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
        isIOS: isIOS,
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

    return {
      id: 'webspeech',
      name: 'Web Speech API',
      description: isSupported
        ? isIOS
          ? 'Browser built-in speech recognition (FREE, no API key). iOS Safari has limited support - may stop after ~60 seconds.'
          : 'Browser built-in speech recognition (FREE, no API key). Requires internet connection in Chrome/Edge.'
        : 'Not supported in this browser (requires Chrome, Edge, or Safari 14.1+)',
      supportsContinuous: !isIOS, // iOS doesn't support true continuous mode
      requiresApiKey: false,
      requiresLocalServer: false,
      requiresInternet: true,
      browserSupport: 'chrome-edge-safari',
      iosSupport: 'limited',
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
          disabled: isIOS,
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
        'Using iPhone/iPad? Consider using Azure or Whisper provider for better iOS support',
        'Network error? Check your internet connection',
        'Using VPN? Try disabling it',
        'Microphone blocked? Allow microphone access in browser settings',
        'iOS Safari: Web Speech may stop after 60 seconds - this is a browser limitation',
        'Still not working? Try Azure, Whisper, or Deepgram providers instead',
      ],
    };
  }
}

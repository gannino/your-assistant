/**
 * DeepgramTranscriptionProvider - Deepgram Speech-to-Text API
 *
 * Uses Deepgram's real-time streaming transcription API.
 * Fast, accurate, and great for live sessions.
 */

import { BaseTranscriptionProvider } from '../BaseTranscriptionProvider';

export class DeepgramTranscriptionProvider extends BaseTranscriptionProvider {
  constructor() {
    super({});
    this.socket = null;
    this.mediaRecorder = null;
  }

  /**
   * Initialize the Deepgram provider with configuration
   * @param {Object} config - Configuration object
   * @param {string} config.apiKey - Deepgram API key
   * @param {string} config.language - Language code (default: 'en')
   * @param {string} config.model - Model to use (default: 'nova-2')
   */
  async initialize(config) {
    if (!config.apiKey) {
      throw new Error('Deepgram API key is required');
    }

    this.config = {
      apiKey: config.apiKey,
      language: config.language || 'en',
      model: config.model || 'nova-2',
      ...config,
    };

    this.initialized = true;
    console.log('[Deepgram Transcription] Initialized with model:', this.config.model);
  }

  /**
   * Start continuous speech recognition using WebSocket streaming
   * @param {Function} onResult - Callback(transcript) for each result
   * @param {Function} onError - Callback(error) for errors
   */
  async startRecognition(onResult, onError) {
    if (!this.initialized) {
      throw new Error('Deepgram provider not initialized. Call initialize() first.');
    }

    if (this.isRecording) {
      console.warn('[Deepgram Transcription] Already recording');
      return;
    }

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create WebSocket connection to Deepgram with proper authentication
      const url = new URL('wss://api.deepgram.com/v1/listen');
      url.searchParams.append('model', this.config.model);
      url.searchParams.append('language', this.config.language);
      url.searchParams.append('smart_format', 'true');
      url.searchParams.append('encoding', 'linear16');
      url.searchParams.append('sample_rate', '16000');
      url.searchParams.append('channels', '1');
      url.searchParams.append('punctuate', 'true');
      url.searchParams.append('profanity_filter', 'false');
      url.searchParams.append('diarize', 'false');

      // Deepgram authentication: Handle both API Keys and API Secrets
      // For WebSocket connections, both API Keys and API Secrets use the same format
      // The key parameter should work for both types of credentials
      url.searchParams.append('key', this.config.apiKey);
      console.log('[Deepgram Transcription] Using key parameter authentication');

      this.socket = new WebSocket(url.toString());
      this.socket.binaryType = 'arraybuffer';

      this.socket.onopen = async () => {
        console.log('[Deepgram Transcription] WebSocket connected');

        // Send pre-recorded audio config
        const configMessage = {
          type: 'Configure',
          config: {
            smart_format: true,
            interim_results: true,
            punctuate: true,
            profanity_filter: false,
            diarize: false,
          },
        };
        this.socket.send(JSON.stringify(configMessage));

        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        this.mediaRecorder = mediaRecorder;

        mediaRecorder.ondataavailable = async event => {
          if (event.data.size > 0 && this.socket.readyState === WebSocket.OPEN) {
            // Convert WebM to PCM for Deepgram
            const audioBuffer = await event.data.arrayBuffer();
            this.socket.send(audioBuffer);
          }
        };

        mediaRecorder.start(250); // Send data every 250ms
        this.isRecording = true;
        console.log('[Deepgram Transcription] Started streaming');
      };

      this.socket.onmessage = message => {
        try {
          const response = JSON.parse(message.data);

          if (response.type === 'Results' && response.channel && response.channel.alternatives) {
            const transcript = response.channel.alternatives[0]?.transcript;

            if (transcript && transcript.trim().length > 0) {
              // Only call onResult for interim results, not final
              if (!response.is_final) {
                onResult(transcript);
              }
            }
          }
        } catch (parseError) {
          console.warn('[Deepgram Transcription] Failed to parse message:', parseError);
        }
      };

      this.socket.onerror = error => {
        console.error('[Deepgram Transcription] WebSocket error:', error);
        console.error('[Deepgram Transcription] URL used:', url.toString());
        console.error(
          '[Deepgram Transcription] API Key format:',
          this.config.apiKey.substring(0, 10) + '...'
        );

        if (onError) {
          onError(new Error('Deepgram WebSocket connection error. Check console for details.'));
        }
      };

      this.socket.onclose = event => {
        console.log('[Deepgram Transcription] WebSocket closed:', event.code, event.reason);
        this.isRecording = false;
      };
    } catch (error) {
      this.isRecording = false;
      console.error('[Deepgram Transcription] Error starting recognition:', error);
      throw error;
    }
  }

  /**
   * Stop continuous speech recognition
   */
  async stopRecognition() {
    if (!this.isRecording) {
      console.warn('[Deepgram Transcription] Not recording');
      return;
    }

    this.isRecording = false;

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    console.log('[Deepgram Transcription] Stopped recognition');
  }

  /**
   * Validate the Deepgram configuration
   */
  async validateConfig() {
    const errors = [];

    if (!this.config.apiKey) {
      errors.push('Deepgram API key is required');
    }

    if (!this.config.language) {
      errors.push('Language is required');
    }

    if (!this.config.model) {
      errors.push('Model is required');
    }

    return {
      valid: errors.length === 0,
      errors,
      diagnostics: {
        model: this.config.model,
        language: this.config.language,
        hasApiKey: !!this.config.apiKey,
      },
    };
  }

  /**
   * Check browser support (requires WebSocket and getUserMedia)
   */
  checkBrowserSupport() {
    return !!(window.WebSocket && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.isRecording = false;
    this.initialized = false;
  }

  /**
   * Get provider metadata
   */
  getProviderInfo() {
    return {
      id: 'deepgram',
      name: 'Deepgram',
      description: 'Real-time streaming speech recognition with low latency',
      supportsContinuous: true,
      requiresApiKey: true,
      requiresLocalServer: false,
      browserSupport: 'all',
      documentationUrl: 'https://developers.deepgram.com/docs/',
      configFields: [
        { name: 'apiKey', label: 'Deepgram API Key', type: 'password', required: true },
        {
          name: 'model',
          label: 'Model',
          type: 'select',
          required: false,
          options: ['nova-2', 'nova', 'enhanced'],
        },
        {
          name: 'language',
          label: 'Language',
          type: 'select',
          required: false,
          options: ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko'],
        },
      ],
      languageSupport: [
        { code: 'en', name: 'English' },
        { code: 'zh', name: 'Chinese' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
      ],
    };
  }
}

/**
 * DeepgramTranscriptionProvider - Deepgram Speech-to-Text API
 *
 * Uses Deepgram's official SDK for reliable real-time streaming transcription.
 * Fast, accurate, and great for live sessions.
 */

import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { BaseTranscriptionProvider } from '../BaseTranscriptionProvider';

export class DeepgramTranscriptionProvider extends BaseTranscriptionProvider {
  constructor() {
    super({});
    this.deepgram = null;
    this.connection = null;
    this.mediaRecorder = null;
    this.mediaStream = null;
    this.audioChunks = [];
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
      apiKey: config.apiKey.trim(),
      language: config.language || 'en',
      model: config.model || 'nova-2',
      ...config,
    };

    // Create Deepgram client using official SDK
    this.deepgram = createClient(this.config.apiKey);

    this.initialized = true;
    console.log('[Deepgram Transcription] ✅ Initialized with model:', this.config.model);
    console.log(
      '[Deepgram Transcription] API Key:',
      this.config.apiKey.substring(0, 8) + '...' + this.config.apiKey.slice(-4)
    );
    console.log('[Deepgram Transcription] SDK version: 3.x');
  }

  /**
   * Start continuous speech recognition using Deepgram SDK
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
      // Get microphone access with specific constraints for Deepgram
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.mediaStream = stream;
      console.log('[Deepgram Transcription] Microphone access granted');

      // Create live transcription connection
      this.connection = this.deepgram.listen.live({
        model: this.config.model,
        language: this.config.language,
        smart_format: true,
        interim_results: true,
        punctuate: true,
        profanity_filter: false,
        diarize: false,
        filler_words: true,
        sample_rate: 16000,
      });

      console.log('[Deepgram Transcription] Connecting to Deepgram SDK...');

      // Set up event handlers using Deepgram SDK events
      this.connection.on(LiveTranscriptionEvents.Open, () => {
        console.log('[Deepgram Transcription] ✅ Connection established via SDK');

        try {
          // Use MediaRecorder to capture audio
          // Try different MIME types to find one supported
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
              ? 'audio/ogg;codecs=opus'
              : '';

          this.mediaRecorder = mimeType
            ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 16000 })
            : new MediaRecorder(stream);

          console.log(
            '[Deepgram Transcription] MediaRecorder created with MIME type:',
            this.mediaRecorder.mimeType
          );

          let audioDataSent = false;

          this.mediaRecorder.ondataavailable = async event => {
            if (event.data.size > 0 && this.connection && this.connection.getReadyState() === 1) {
              try {
                // Convert the audio blob to array buffer
                const arrayBuffer = await event.data.arrayBuffer();

                // Send the audio data to Deepgram
                this.connection.send(arrayBuffer);

                if (!audioDataSent) {
                  console.log('[Deepgram Transcription] 🎵 First audio data sent to Deepgram');
                  audioDataSent = true;
                }
              } catch (error) {
                console.error('[Deepgram Transcription] Error sending audio data:', error);
              }
            }
          };

          // Start recording with small time slices for real-time streaming
          this.mediaRecorder.start(250); // Send data every 250ms

          this.isRecording = true;
          console.log('[Deepgram Transcription] 🎤 Started streaming audio');
        } catch (error) {
          console.error('[Deepgram Transcription] ❌ Error setting up audio processing:', error);
          if (onError) {
            onError(new Error('Failed to setup audio processing: ' + error.message));
          }
          this.connection.close();
          return;
        }
      });

      this.connection.on(LiveTranscriptionEvents.Transcript, data => {
        if (data.channel?.alternatives?.[0]) {
          const transcript = data.channel.alternatives[0].transcript;

          if (transcript && transcript.trim().length > 0) {
            // Only send final results for clean transcription
            // Interim results (is_final=false) are partial and keep changing
            if (data.is_final) {
              console.log('[Deepgram Transcription] Final result:', transcript);
              onResult(transcript);
            } else {
              // Optional: Log interim results for debugging
              console.log('[Deepgram Transcription] Interim result (not displayed):', transcript);
            }
          }
        }
      });

      this.connection.on(LiveTranscriptionEvents.Metadata, data => {
        console.log('[Deepgram Transcription] Metadata received:', data);
      });

      this.connection.on(LiveTranscriptionEvents.SpeechStarted, () => {
        console.log('[Deepgram Transcription] Speech started');
      });

      this.connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
        console.log('[Deepgram Transcription] Utterance ended');
      });

      this.connection.on(LiveTranscriptionEvents.Close, () => {
        console.log('[Deepgram Transcription] Connection closed normally');
        this.isRecording = false;
      });

      this.connection.on(LiveTranscriptionEvents.Error, error => {
        console.error('[Deepgram Transcription] ❌ Connection error:', error);

        let errorMessage = 'Deepgram connection error.\n\n';

        if (error.message) {
          errorMessage += 'Error: ' + error.message + '\n\n';
        } else if (error.stack) {
          errorMessage += 'Check console for technical details.\n\n';
        }

        errorMessage += '🔧 Troubleshooting:\n';
        errorMessage += '1. Verify API key at https://console.deepgram.com/\n';
        errorMessage += '2. Check Deepgram status: https://status.deepgram.com/\n';
        errorMessage += '3. Try disabling VPN/proxy temporarily\n';
        errorMessage += '4. Ensure network allows WebSocket (port 443)\n\n';
        errorMessage += '💡 Alternative: Use Web Speech API (no API key needed)';

        if (onError) {
          onError(new Error(errorMessage));
        }

        this.isRecording = false;
      });
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

    // Stop media recorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    // Stop media stream tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Close Deepgram connection
    if (this.connection) {
      if (this.connection.finish) {
        this.connection.finish();
      }
      this.connection = null;
    }

    console.log('[Deepgram Transcription] Stopped recognition');
  }

  /**
   * Validate the Deepgram configuration
   */
  async validateConfig() {
    const errors = [];
    const warnings = [];

    if (!this.config.apiKey) {
      errors.push('Deepgram API key is required');
    } else {
      // Check API key format
      if (this.config.apiKey.length < 20) {
        warnings.push('API key seems too short (expected 32+ chars)');
      }
    }

    if (!this.config.language) {
      errors.push('Language is required');
    }

    if (!this.config.model) {
      errors.push('Model is required');
    }

    // Try to validate API key by making a simple connection test
    try {
      console.log('[Deepgram Transcription] Testing API key validity...');

      // Create a test connection
      const testConnection = this.deepgram.listen.live({
        model: this.config.model,
        language: this.config.language,
        interim_results: false,
      });

      // Set a timeout to close the test connection
      setTimeout(() => {
        if (testConnection.getReadyState() === 1) {
          testConnection.finish();
          console.log('[Deepgram Transcription] ✅ API key test passed');
        }
      }, 5000);

      testConnection.on(LiveTranscriptionEvents.Error, error => {
        warnings.push('API key test failed: ' + (error.message || 'Unknown error'));
      });
    } catch (error) {
      warnings.push('Could not test API key: ' + error.message);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      diagnostics: {
        model: this.config.model,
        language: this.config.language,
        hasApiKey: !!this.config.apiKey,
        apiKeyFormat: this.config.apiKey.substring(0, 8) + '...' + this.config.apiKey.slice(-4),
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
    await this.stopRecognition();
    this.deepgram = null;
    this.initialized = false;
  }

  /**
   * Get provider metadata
   */
  getProviderInfo() {
    return {
      id: 'deepgram',
      name: 'Deepgram',
      description:
        'Real-time streaming speech recognition with low latency using official Deepgram SDK',
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
          options: ['nova-2', 'nova-3', 'nova', 'enhanced'],
        },
        {
          name: 'language',
          label: 'Language',
          type: 'select',
          required: false,
          options: ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'pt', 'ru', 'hi', 'ar'],
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
        { code: 'pt', name: 'Portuguese' },
        { code: 'ru', name: 'Russian' },
        { code: 'hi', name: 'Hindi' },
        { code: 'ar', name: 'Arabic' },
      ],
    };
  }
}

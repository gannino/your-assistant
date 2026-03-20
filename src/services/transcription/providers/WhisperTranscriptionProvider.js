/**
 * WhisperTranscriptionProvider - OpenAI Whisper API
 *
 * Uses OpenAI's Whisper model for speech-to-text transcription.
 * Provides state-of-the-art accuracy with simple REST API integration.
 */

import { BaseTranscriptionProvider } from '../BaseTranscriptionProvider';

export class WhisperTranscriptionProvider extends BaseTranscriptionProvider {
  constructor() {
    super({});
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  /**
   * Initialize the Whisper provider with configuration
   * @param {Object} config - Configuration object
   * @param {string} config.apiKey - OpenAI API key
   * @param {string} config.model - Whisper model (default: 'whisper-1')
   * @param {string} config.language - Language code (default: 'en')
   */
  async initialize(config) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required for Whisper');
    }

    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'whisper-1',
      language: config.language || 'en',
      ...config,
    };

    this.initialized = true;
    console.log('[Whisper Transcription] Initialized with model:', this.config.model);
  }

  /**
   * Start continuous speech recognition
   * Records audio chunks and transcribes them periodically
   * @param {Function} onResult - Callback(transcript) for each result
   * @param {Function} onError - Callback(error) for errors
   */
  async startRecognition(onResult, onError) {
    if (!this.initialized) {
      throw new Error('Whisper provider not initialized. Call initialize() first.');
    }

    if (this.isRecording) {
      console.warn('[Whisper Transcription] Already recording');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = event => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        if (!this.isRecording) return;

        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];

        try {
          const transcript = await this.transcribeAudio(audioBlob);
          if (transcript && transcript.trim().length > 0) {
            onResult(transcript);
          }

          // Continue recording if still active
          if (this.isRecording) {
            this.audioChunks = [];
            this.mediaRecorder.start();
          }
        } catch (error) {
          console.error('[Whisper Transcription] Transcription error:', error);
          if (onError) {
            onError(error);
          }
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      // Automatically stop and transcribe every 5 seconds
      this.transcriptionInterval = setInterval(() => {
        if (this.isRecording && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        }
      }, 5000);

      console.log('[Whisper Transcription] Started continuous recognition');
    } catch (error) {
      this.isRecording = false;
      console.error('[Whisper Transcription] Error starting recognition:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio using Whisper API
   * @param {Blob} audioBlob - Audio data blob
   * @returns {Promise<string>} Transcribed text
   */
  async transcribeAudio(audioBlob) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', this.config.model);

    if (this.config.language) {
      formData.append('language', this.config.language);
    }

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Whisper API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.text;
  }

  /**
   * Stop continuous speech recognition
   */
  async stopRecognition() {
    if (!this.isRecording) {
      console.warn('[Whisper Transcription] Not recording');
      return;
    }

    this.isRecording = false;

    if (this.transcriptionInterval) {
      clearInterval(this.transcriptionInterval);
      this.transcriptionInterval = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    if (this.mediaRecorder && this.mediaRecorder.stream) {
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    this.mediaRecorder = null;
    console.log('[Whisper Transcription] Stopped recognition');
  }

  /**
   * Validate the Whisper configuration
   */
  async validateConfig() {
    const errors = [];

    if (!this.config.apiKey) {
      errors.push('OpenAI API key is required');
    }

    if (this.config.apiKey && !this.config.apiKey.startsWith('sk-')) {
      errors.push('API key should start with "sk-"');
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
   * Check browser support (requires MediaRecorder and getUserMedia)
   */
  checkBrowserSupport() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && MediaRecorder);
  }

  /**
   * Get provider metadata
   */
  getProviderInfo() {
    return {
      id: 'whisper',
      name: 'OpenAI Whisper',
      description: 'State-of-the-art speech recognition using OpenAI Whisper',
      supportsContinuous: true,
      requiresApiKey: true,
      requiresLocalServer: false,
      browserSupport: 'all',
      documentationUrl: 'https://platform.openai.com/docs/guides/speech-to-text',
      configFields: [
        { name: 'apiKey', label: 'OpenAI API Key', type: 'password', required: true },
        { name: 'model', label: 'Model', type: 'select', required: false, options: ['whisper-1'] },
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
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
      ],
    };
  }
}

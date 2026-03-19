/**
 * BaseTranscriptionProvider - Abstract base class for transcription providers
 *
 * All transcription providers must extend this class and implement
 * the required methods for speech-to-text conversion.
 */

export class BaseTranscriptionProvider {
  constructor(config = {}) {
    if (new.target === BaseTranscriptionProvider) {
      throw new Error('BaseTranscriptionProvider is abstract and cannot be instantiated directly');
    }
    this.config = config;
    this.initialized = false;
    this.isRecording = false;
  }

  /**
   * Initialize the transcription provider with configuration
   * @param {Object} config - Configuration object
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('initialize must be implemented by subclass');
  }

  /**
   * Start continuous speech recognition
   * @param {Function} onResult - Callback function(transcript) for each result
   * @param {Function} onError - Callback function(error) for errors
   * @returns {Promise<void>}
   */
  async startRecognition() {
    throw new Error('startRecognition must be implemented by subclass');
  }

  /**
   * Stop continuous speech recognition
   * @returns {Promise<void>}
   */
  async stopRecognition() {
    throw new Error('stopRecognition must be implemented by subclass');
  }

  /**
   * Check if the provider is currently recording
   * @returns {boolean}
   */
  isRecognizing() {
    return this.isRecording;
  }

  /**
   * Validate the provider configuration
   * @returns {Promise<Object>} Validation result with { valid: boolean, errors: [] }
   */
  async validateConfig() {
    return { valid: true, errors: [] };
  }

  /**
   * Get provider metadata
   * @returns {Object} Provider information
   */
  getProviderInfo() {
    return {
      id: this.constructor.name.toLowerCase().replace('provider', ''),
      name: 'Base Transcription Provider',
      description: 'Base transcription provider',
      supportsContinuous: true,
      requiresApiKey: true,
      requiresLocalServer: false,
      browserSupport: 'all',
    };
  }

  /**
   * Check browser compatibility for this provider
   * @returns {boolean} True if provider works in current browser
   */
  checkBrowserSupport() {
    return true;
  }
}

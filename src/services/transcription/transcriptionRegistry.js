/**
 * TranscriptionProviderRegistry - Central registry for transcription providers
 *
 * Manages available speech-to-text providers and provides
 * methods to retrieve and configure them.
 */

import { AzureTranscriptionProvider } from './providers/AzureTranscriptionProvider';
import { WhisperTranscriptionProvider } from './providers/WhisperTranscriptionProvider';
import { WebSpeechTranscriptionProvider } from './providers/WebSpeechTranscriptionProvider';
import { DeepgramTranscriptionProvider } from './providers/DeepgramTranscriptionProvider';

class TranscriptionProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.registerDefaultProviders();
  }

  registerDefaultProviders() {
    this.register(new AzureTranscriptionProvider());
    this.register(new WhisperTranscriptionProvider());
    this.register(new WebSpeechTranscriptionProvider());
    this.register(new DeepgramTranscriptionProvider());
  }

  /**
   * Register a transcription provider
   * @param {BaseTranscriptionProvider} provider - Provider instance
   */
  register(provider) {
    const info = provider.getProviderInfo();
    this.providers.set(info.id, provider);
    console.log(`[TranscriptionRegistry] Registered provider: ${info.name}`);
  }

  /**
   * Get a provider by ID
   * @param {string} providerId - Provider identifier
   * @returns {BaseTranscriptionProvider|null} Provider instance or null
   */
  get(providerId) {
    return this.providers.get(providerId) || null;
  }

  /**
   * Get all registered providers
   * @returns {Array<BaseTranscriptionProvider>} Array of provider instances
   */
  getAll() {
    return Array.from(this.providers.values());
  }

  /**
   * Get info for all providers
   * @returns {Array<Object>} Array of provider info objects
   */
  getAllInfo() {
    return Array.from(this.providers.values()).map(provider => provider.getProviderInfo());
  }

  /**
   * Check if a provider is registered
   * @param {string} providerId - Provider identifier
   * @returns {boolean}
   */
  has(providerId) {
    return this.providers.has(providerId);
  }

  /**
   * Get providers that work in the current browser
   * @returns {Array<BaseTranscriptionProvider>} Array of compatible providers
   */
  getCompatibleProviders() {
    return this.getAll().filter(provider => provider.checkBrowserSupport());
  }
}

// Export class and singleton instance
export { TranscriptionProviderRegistry };
export const transcriptionRegistry = new TranscriptionProviderRegistry();

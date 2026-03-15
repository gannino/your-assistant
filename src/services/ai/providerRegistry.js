/**
 * ProviderRegistry - Centralized registry for AI providers
 *
 * Manages registration and retrieval of AI providers.
 * Provides a simple interface to get providers by ID.
 */

// Import providers (will be implemented next)
import { OpenAIProvider } from './providers/OpenAIProvider';
import { ZaiProvider } from './providers/ZaiProvider';
import { OllamaProvider } from './providers/OllamaProvider';
import { MLXProvider } from './providers/MLXProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { GeminiProvider } from './providers/GeminiProvider';

class ProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.registerDefaultProviders();
  }

  /**
   * Register all default providers
   */
  registerDefaultProviders() {
    try {
      this.register(new OpenAIProvider());
    } catch (e) {
      console.warn('Failed to register OpenAI provider:', e.message);
    }

    try {
      this.register(new ZaiProvider());
    } catch (e) {
      console.warn('Failed to register Z.ai provider:', e.message);
    }

    try {
      this.register(new OllamaProvider());
    } catch (e) {
      console.warn('Failed to register Ollama provider:', e.message);
    }

    try {
      this.register(new MLXProvider());
    } catch (e) {
      console.warn('Failed to register MLX provider:', e.message);
    }

    try {
      this.register(new AnthropicProvider());
    } catch (e) {
      console.warn('Failed to register Anthropic provider:', e.message);
    }

    try {
      this.register(new GeminiProvider());
    } catch (e) {
      console.warn('Failed to register Gemini provider:', e.message);
    }
  }

  /**
   * Register a new provider
   * @param {BaseAIProvider} provider - The provider instance to register
   */
  register(provider) {
    if (!provider || !provider.getProviderInfo) {
      throw new Error('Invalid provider: must extend BaseAIProvider');
    }

    const info = provider.getProviderInfo();
    if (!info.id) {
      throw new Error('Provider must have an id in getProviderInfo()');
    }

    this.providers.set(info.id, provider);
    console.log(`Registered AI provider: ${info.name} (${info.id})`);
  }

  /**
   * Get a provider by ID
   * @param {string} providerId - The provider ID
   * @returns {BaseAIProvider|null} The provider instance or null if not found
   */
  get(providerId) {
    return this.providers.get(providerId) || null;
  }

  /**
   * Get all registered providers
   * @returns {Array<BaseAIProvider>} Array of all providers
   */
  getAll() {
    return Array.from(this.providers.values());
  }

  /**
   * Get all provider info objects
   * @returns {Array<Object>} Array of provider metadata
   */
  getAllInfo() {
    return this.getAll().map(provider => provider.getProviderInfo());
  }

  /**
   * Check if a provider exists
   * @param {string} providerId - The provider ID
   * @returns {boolean} True if provider exists
   */
  has(providerId) {
    return this.providers.has(providerId);
  }
}

// Create and export singleton instance
export const providerRegistry = new ProviderRegistry();

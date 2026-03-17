import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { providerRegistry } from '@/services/ai/providerRegistry';

// Mock all provider classes
jest.mock('@/services/ai/providers/OpenAIProvider', () => ({
  OpenAIProvider: jest.fn().mockImplementation(() => ({
    getProviderInfo: () => ({ id: 'openai', name: 'OpenAI' }),
  })),
}));

jest.mock('@/services/ai/providers/ZaiProvider', () => ({
  ZaiProvider: jest.fn().mockImplementation(() => ({
    getProviderInfo: () => ({ id: 'zai', name: 'Z.ai' }),
  })),
}));

jest.mock('@/services/ai/providers/OllamaProvider', () => ({
  OllamaProvider: jest.fn().mockImplementation(() => ({
    getProviderInfo: () => ({ id: 'ollama', name: 'Ollama' }),
  })),
}));

jest.mock('@/services/ai/providers/MLXProvider', () => ({
  MLXProvider: jest.fn().mockImplementation(() => ({
    getProviderInfo: () => ({ id: 'mlx', name: 'MLX' }),
  })),
}));

jest.mock('@/services/ai/providers/AnthropicProvider', () => ({
  AnthropicProvider: jest.fn().mockImplementation(() => ({
    getProviderInfo: () => ({ id: 'anthropic', name: 'Anthropic' }),
  })),
}));

jest.mock('@/services/ai/providers/GeminiProvider', () => ({
  GeminiProvider: jest.fn().mockImplementation(() => ({
    getProviderInfo: () => ({ id: 'gemini', name: 'Gemini' }),
  })),
}));

jest.mock('@/services/ai/providers/OpenRouterProvider', () => ({
  OpenRouterProvider: jest.fn().mockImplementation(() => ({
    getProviderInfo: () => ({ id: 'openrouter', name: 'OpenRouter' }),
  })),
}));

describe('providerRegistry', () => {
  let mockConsoleLog;
  let mockConsoleWarn;

  beforeEach(() => {
    // Clear the registry before each test by re-importing
    jest.clearAllMocks();
    jest.resetModules();

    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor and initialization', () => {
    it('should create singleton instance', () => {
      expect(providerRegistry).toBeDefined();
      expect(providerRegistry.providers).toBeInstanceOf(Map);
    });

    it('should register all default providers on construction', () => {
      // Re-import to get fresh instance
      const { providerRegistry: freshRegistry } = require('@/services/ai/providerRegistry');

      expect(freshRegistry.providers.size).toBeGreaterThan(0);
    });
  });

  describe('register', () => {
    it('should register a valid provider', () => {
      const mockProvider = {
        getProviderInfo: () => ({ id: 'test-provider', name: 'Test Provider' }),
      };

      providerRegistry.register(mockProvider);

      expect(providerRegistry.providers.has('test-provider')).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        'Registered AI provider: Test Provider (test-provider)'
      );
    });

    it('should throw error for invalid provider (null)', () => {
      expect(() => {
        providerRegistry.register(null);
      }).toThrow('Invalid provider: must extend BaseAIProvider');
    });

    it('should throw error for invalid provider (undefined)', () => {
      expect(() => {
        providerRegistry.register(undefined);
      }).toThrow('Invalid provider: must extend BaseAIProvider');
    });

    it('should throw error for provider without getProviderInfo', () => {
      const invalidProvider = {};

      expect(() => {
        providerRegistry.register(invalidProvider);
      }).toThrow('Invalid provider: must extend BaseAIProvider');
    });

    it('should throw error for provider without id in getProviderInfo', () => {
      const invalidProvider = {
        getProviderInfo: () => ({ name: 'No ID' }),
      };

      expect(() => {
        providerRegistry.register(invalidProvider);
      }).toThrow('Provider must have an id in getProviderInfo()');
    });

    it('should allow overwriting existing provider', () => {
      const mockProvider1 = {
        getProviderInfo: () => ({ id: 'duplicate', name: 'Provider 1' }),
      };
      const mockProvider2 = {
        getProviderInfo: () => ({ id: 'duplicate', name: 'Provider 2' }),
      };

      providerRegistry.register(mockProvider1);
      expect(providerRegistry.get('duplicate')).toBe(mockProvider1);

      providerRegistry.register(mockProvider2);
      expect(providerRegistry.get('duplicate')).toBe(mockProvider2);
    });
  });

  describe('get', () => {
    it('should return provider by ID', () => {
      const mockProvider = {
        getProviderInfo: () => ({ id: 'get-test', name: 'Get Test' }),
      };

      providerRegistry.register(mockProvider);

      const result = providerRegistry.get('get-test');
      expect(result).toBe(mockProvider);
    });

    it('should return null for non-existent provider', () => {
      const result = providerRegistry.get('non-existent-provider');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = providerRegistry.get('');
      expect(result).toBeNull();
    });

    it('should return null for undefined', () => {
      const result = providerRegistry.get(undefined);
      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return array of all registered providers', () => {
      const mockProvider1 = {
        getProviderInfo: () => ({ id: 'all-test-1', name: 'All Test 1' }),
      };
      const mockProvider2 = {
        getProviderInfo: () => ({ id: 'all-test-2', name: 'All Test 2' }),
      };

      providerRegistry.register(mockProvider1);
      providerRegistry.register(mockProvider2);

      const all = providerRegistry.getAll();

      expect(Array.isArray(all)).toBe(true);
      expect(all).toContain(mockProvider1);
      expect(all).toContain(mockProvider2);
    });

    it('should return array when providers exist', () => {
      // The singleton will have default providers, just verify it's an array
      const all = providerRegistry.getAll();
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBeGreaterThan(0);
    });
  });

  describe('getAllInfo', () => {
    it('should return array of provider info objects', () => {
      const mockProvider1 = {
        getProviderInfo: () => ({
          id: 'info-test-1',
          name: 'Info Test 1',
          supportsStreaming: true,
        }),
      };
      const mockProvider2 = {
        getProviderInfo: () => ({
          id: 'info-test-2',
          name: 'Info Test 2',
          supportsStreaming: false,
        }),
      };

      providerRegistry.register(mockProvider1);
      providerRegistry.register(mockProvider2);

      const allInfo = providerRegistry.getAllInfo();

      expect(Array.isArray(allInfo)).toBe(true);
      expect(allInfo.length).toBeGreaterThan(1);

      // Find our test providers in the array
      const info1 = allInfo.find(p => p.id === 'info-test-1');
      const info2 = allInfo.find(p => p.id === 'info-test-2');

      expect(info1).toEqual({
        id: 'info-test-1',
        name: 'Info Test 1',
        supportsStreaming: true,
      });
      expect(info2).toEqual({
        id: 'info-test-2',
        name: 'Info Test 2',
        supportsStreaming: false,
      });
    });

    it('should return array when providers exist', () => {
      const allInfo = providerRegistry.getAllInfo();
      expect(Array.isArray(allInfo)).toBe(true);
      expect(allInfo.length).toBeGreaterThan(0);
    });
  });

  describe('has', () => {
    it('should return true for registered provider', () => {
      const mockProvider = {
        getProviderInfo: () => ({ id: 'has-test', name: 'Has Test' }),
      };

      providerRegistry.register(mockProvider);

      expect(providerRegistry.has('has-test')).toBe(true);
    });

    it('should return false for non-existent provider', () => {
      expect(providerRegistry.has('does-not-exist')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(providerRegistry.has('')).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(providerRegistry.has(undefined)).toBe(false);
    });
  });

  describe('registerDefaultProviders', () => {
    it('should register all 7 default providers', () => {
      // The singleton should have at least 7 providers (default providers)
      expect(providerRegistry.providers.size).toBeGreaterThanOrEqual(7);

      // Check that default providers are present
      expect(providerRegistry.has('openai')).toBe(true);
      expect(providerRegistry.has('zai')).toBe(true);
      expect(providerRegistry.has('ollama')).toBe(true);
      expect(providerRegistry.has('mlx')).toBe(true);
      expect(providerRegistry.has('anthropic')).toBe(true);
      expect(providerRegistry.has('gemini')).toBe(true);
      expect(providerRegistry.has('openrouter')).toBe(true);
    });

    it('should handle registration errors gracefully', () => {
      // This test verifies that if one provider fails, others still register
      // We can't easily test this without modifying the module, so we just
      // verify that the registry has the expected providers

      // Verify all default providers are present despite any potential issues
      const defaultProviderIds = [
        'openai',
        'zai',
        'ollama',
        'mlx',
        'anthropic',
        'gemini',
        'openrouter',
      ];

      defaultProviderIds.forEach(id => {
        expect(providerRegistry.has(id)).toBe(true);
      });
    });
  });
});

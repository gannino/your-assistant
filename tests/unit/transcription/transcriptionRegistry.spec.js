import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock all transcription providers before importing
jest.mock('@/services/transcription/providers/AzureTranscriptionProvider', () => ({
  AzureTranscriptionProvider: jest.fn().mockImplementation(() => ({
    getProviderInfo: jest.fn(() => ({
      id: 'azure',
      name: 'Microsoft Azure Speech',
    })),
    checkBrowserSupport: jest.fn(() => true),
  })),
}));

jest.mock('@/services/transcription/providers/WhisperTranscriptionProvider', () => ({
  WhisperTranscriptionProvider: jest.fn().mockImplementation(() => ({
    getProviderInfo: jest.fn(() => ({
      id: 'whisper',
      name: 'OpenAI Whisper',
    })),
    checkBrowserSupport: jest.fn(() => true),
  })),
}));

jest.mock('@/services/transcription/providers/WebSpeechTranscriptionProvider', () => ({
  WebSpeechTranscriptionProvider: jest.fn().mockImplementation(() => ({
    getProviderInfo: jest.fn(() => ({
      id: 'webspeech',
      name: 'Web Speech API',
    })),
    checkBrowserSupport: jest.fn(() => true),
  })),
}));

jest.mock('@/services/transcription/providers/DeepgramTranscriptionProvider', () => ({
  DeepgramTranscriptionProvider: jest.fn().mockImplementation(() => ({
    getProviderInfo: jest.fn(() => ({
      id: 'deepgram',
      name: 'Deepgram',
    })),
    checkBrowserSupport: jest.fn(() => true),
  })),
}));

import { TranscriptionProviderRegistry } from '@/services/transcription/transcriptionRegistry';
import { AzureTranscriptionProvider } from '@/services/transcription/providers/AzureTranscriptionProvider';
import { WhisperTranscriptionProvider } from '@/services/transcription/providers/WhisperTranscriptionProvider';
import { WebSpeechTranscriptionProvider } from '@/services/transcription/providers/WebSpeechTranscriptionProvider';
import { DeepgramTranscriptionProvider } from '@/services/transcription/providers/DeepgramTranscriptionProvider';

describe('TranscriptionProviderRegistry', () => {
  let registry;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();

    // Create a fresh registry for each test to avoid singleton state pollution
    registry = new TranscriptionProviderRegistry();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create providers Map', () => {
      expect(registry.providers).toBeInstanceOf(Map);
    });

    it('should register default providers', () => {
      expect(registry.providers.size).toBe(4);
    });
  });

  describe('registerDefaultProviders', () => {
    it('should register all default providers', () => {
      expect(registry.providers.size).toBe(4);
    });

    it('should register Azure provider', () => {
      expect(registry.has('azure')).toBe(true);
    });

    it('should register Whisper provider', () => {
      expect(registry.has('whisper')).toBe(true);
    });

    it('should register WebSpeech provider', () => {
      expect(registry.has('webspeech')).toBe(true);
    });

    it('should register Deepgram provider', () => {
      expect(registry.has('deepgram')).toBe(true);
    });

    it('should log registration for each provider', () => {
      expect(console.log).toHaveBeenCalledWith(
        '[TranscriptionRegistry] Registered provider: Microsoft Azure Speech'
      );
      expect(console.log).toHaveBeenCalledWith(
        '[TranscriptionRegistry] Registered provider: OpenAI Whisper'
      );
      expect(console.log).toHaveBeenCalledWith(
        '[TranscriptionRegistry] Registered provider: Web Speech API'
      );
      expect(console.log).toHaveBeenCalledWith(
        '[TranscriptionRegistry] Registered provider: Deepgram'
      );
    });
  });

  describe('register', () => {
    it('should add provider to registry', () => {
      const mockProvider = {
        getProviderInfo: jest.fn(() => ({
          id: 'custom',
          name: 'Custom Provider',
        })),
      };

      registry.register(mockProvider);

      expect(registry.has('custom')).toBe(true);
    });

    it('should call getProviderInfo on provider', () => {
      const mockProvider = {
        getProviderInfo: jest.fn(() => ({
          id: 'custom',
          name: 'Custom Provider',
        })),
      };

      registry.register(mockProvider);

      expect(mockProvider.getProviderInfo).toHaveBeenCalled();
    });

    it('should log registration message', () => {
      const mockProvider = {
        getProviderInfo: jest.fn(() => ({
          id: 'custom',
          name: 'Custom Provider',
        })),
      };

      registry.register(mockProvider);

      expect(console.log).toHaveBeenCalledWith(
        '[TranscriptionRegistry] Registered provider: Custom Provider'
      );
    });
  });

  describe('get', () => {
    it('should return provider by ID', () => {
      const provider = registry.get('azure');

      expect(provider).not.toBeNull();
      expect(typeof provider.getProviderInfo).toBe('function');
      expect(typeof provider.checkBrowserSupport).toBe('function');
    });

    it('should return null for unknown provider', () => {
      const provider = registry.get('unknown');

      expect(provider).toBeNull();
    });

    it('should return correct provider for each ID', () => {
      const azure = registry.get('azure');
      const whisper = registry.get('whisper');
      const webspeech = registry.get('webspeech');
      const deepgram = registry.get('deepgram');

      expect(azure).not.toBeNull();
      expect(whisper).not.toBeNull();
      expect(webspeech).not.toBeNull();
      expect(deepgram).not.toBeNull();

      // Verify each has the expected methods
      expect(typeof azure.getProviderInfo).toBe('function');
      expect(typeof whisper.getProviderInfo).toBe('function');
      expect(typeof webspeech.getProviderInfo).toBe('function');
      expect(typeof deepgram.getProviderInfo).toBe('function');

      // Verify they return the correct IDs
      expect(azure.getProviderInfo().id).toBe('azure');
      expect(whisper.getProviderInfo().id).toBe('whisper');
      expect(webspeech.getProviderInfo().id).toBe('webspeech');
      expect(deepgram.getProviderInfo().id).toBe('deepgram');
    });
  });

  describe('getAll', () => {
    it('should return array of all providers', () => {
      const providers = registry.getAll();

      expect(Array.isArray(providers)).toBe(true);
      expect(providers).toHaveLength(4);
    });

    it('should include all registered providers', () => {
      const providers = registry.getAll();

      expect(providers.some(p => p.getProviderInfo().id === 'azure')).toBe(true);
      expect(providers.some(p => p.getProviderInfo().id === 'whisper')).toBe(true);
      expect(providers.some(p => p.getProviderInfo().id === 'webspeech')).toBe(true);
      expect(providers.some(p => p.getProviderInfo().id === 'deepgram')).toBe(true);
    });
  });

  describe('getAllInfo', () => {
    it('should return array of provider info objects', () => {
      const infos = registry.getAllInfo();

      expect(Array.isArray(infos)).toBe(true);
      expect(infos).toHaveLength(4);
    });

    it('should call getProviderInfo on each provider', () => {
      const infos = registry.getAllInfo();

      expect(infos[0]).toHaveProperty('id');
      expect(infos[0]).toHaveProperty('name');
      expect(infos[1]).toHaveProperty('id');
      expect(infos[1]).toHaveProperty('name');
      expect(infos[2]).toHaveProperty('id');
      expect(infos[2]).toHaveProperty('name');
      expect(infos[3]).toHaveProperty('id');
      expect(infos[3]).toHaveProperty('name');
    });

    it('should include info for all providers', () => {
      const infos = registry.getAllInfo();

      const ids = infos.map(info => info.id).sort();
      expect(ids).toEqual(['azure', 'deepgram', 'webspeech', 'whisper']);
    });
  });

  describe('has', () => {
    it('should return true for registered provider', () => {
      expect(registry.has('azure')).toBe(true);
      expect(registry.has('whisper')).toBe(true);
      expect(registry.has('webspeech')).toBe(true);
      expect(registry.has('deepgram')).toBe(true);
    });

    it('should return false for unregistered provider', () => {
      expect(registry.has('unknown')).toBe(false);
      expect(registry.has('')).toBe(false);
    });
  });

  describe('getCompatibleProviders', () => {
    it('should return providers that support current browser', () => {
      const compatible = registry.getCompatibleProviders();

      expect(Array.isArray(compatible)).toBe(true);
      expect(compatible).toHaveLength(4);
    });

    it('should filter out providers not supported in browser', () => {
      // Mock one provider to not support browser
      const azureProvider = registry.get('azure');
      azureProvider.checkBrowserSupport = jest.fn(() => false);

      const compatible = registry.getCompatibleProviders();

      expect(compatible).toHaveLength(3);
      expect(compatible.some(p => p === azureProvider)).toBe(false);
    });

    it('should return empty array when no providers supported', () => {
      // Mock all providers to not support browser
      registry.getAll().forEach(provider => {
        provider.checkBrowserSupport = jest.fn(() => false);
      });

      const compatible = registry.getCompatibleProviders();

      expect(compatible).toEqual([]);
    });

    it('should call checkBrowserSupport on each provider', () => {
      registry.getCompatibleProviders();

      const providers = registry.getAll();
      providers.forEach(provider => {
        expect(provider.checkBrowserSupport).toHaveBeenCalled();
      });
    });
  });
});

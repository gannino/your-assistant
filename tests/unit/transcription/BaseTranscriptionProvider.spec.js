import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BaseTranscriptionProvider } from '@/services/transcription/BaseTranscriptionProvider';

// Concrete implementation for testing
class TestTranscriptionProvider extends BaseTranscriptionProvider {
  async initialize(config) {
    this.config = config || {};
    this.initialized = true;
  }

  async startRecognition(onResult, onError) {
    this.isRecording = true;
  }

  async stopRecognition() {
    this.isRecording = false;
  }

  getProviderInfo() {
    return {
      ...super.getProviderInfo(),
      id: 'test',
      name: 'Test Provider',
    };
  }
}

describe('BaseTranscriptionProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new TestTranscriptionProvider();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error when instantiated directly', () => {
      expect(() => new BaseTranscriptionProvider()).toThrow(
        'BaseTranscriptionProvider is abstract and cannot be instantiated directly'
      );
    });

    it('should allow subclass instantiation', () => {
      expect(() => new TestTranscriptionProvider()).not.toThrow();
    });

    it('should set config from constructor', () => {
      const config = { test: 'value' };
      const testProvider = new TestTranscriptionProvider(config);

      expect(testProvider.config).toBe(config);
    });

    it('should initialize with empty config by default', () => {
      expect(provider.config).toEqual({});
      expect(provider.initialized).toBe(false);
      expect(provider.isRecording).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should be implemented by subclass', async () => {
      await provider.initialize({ apiKey: 'test' });

      expect(provider.initialized).toBe(true);
      expect(provider.config.apiKey).toBe('test');
    });
  });

  describe('startRecognition', () => {
    it('should be implemented by subclass', async () => {
      const onResult = jest.fn();
      const onError = jest.fn();

      await provider.startRecognition(onResult, onError);

      expect(provider.isRecording).toBe(true);
    });

    it('should accept onResult callback', async () => {
      const onResult = jest.fn();
      await provider.startRecognition(onResult, jest.fn());

      expect(onResult).toBeDefined();
    });

    it('should accept onError callback', async () => {
      const onError = jest.fn();
      await provider.startRecognition(jest.fn(), onError);

      expect(onError).toBeDefined();
    });
  });

  describe('stopRecognition', () => {
    it('should be implemented by subclass', async () => {
      await provider.startRecognition(jest.fn(), jest.fn());
      expect(provider.isRecording).toBe(true);

      await provider.stopRecognition();

      expect(provider.isRecording).toBe(false);
    });
  });

  describe('isRecognizing', () => {
    it('should return false when not recording', () => {
      expect(provider.isRecognizing()).toBe(false);
    });

    it('should return true when recording', async () => {
      await provider.startRecognition(jest.fn(), jest.fn());

      expect(provider.isRecognizing()).toBe(true);
    });

    it('should return false after stopping', async () => {
      await provider.startRecognition(jest.fn(), jest.fn());
      await provider.stopRecognition();

      expect(provider.isRecognizing()).toBe(false);
    });
  });

  describe('validateConfig', () => {
    it('should return valid by default', async () => {
      const result = await provider.validateConfig();

      expect(result).toEqual({ valid: true, errors: [] });
    });
  });

  describe('getProviderInfo', () => {
    it('should return default provider metadata', () => {
      const info = provider.getProviderInfo();

      expect(info).toHaveProperty('id');
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('description');
      expect(info).toHaveProperty('supportsContinuous');
      expect(info).toHaveProperty('requiresApiKey');
      expect(info).toHaveProperty('requiresLocalServer');
      expect(info).toHaveProperty('browserSupport');
    });

    it('should allow subclass to override metadata', () => {
      const info = provider.getProviderInfo();

      expect(info.id).toBe('test');
      expect(info.name).toBe('Test Provider');
    });

    it('should have default values for supportsContinuous', () => {
      const info = provider.getProviderInfo();

      expect(info.supportsContinuous).toBe(true);
      expect(info.requiresApiKey).toBe(true);
      expect(info.requiresLocalServer).toBe(false);
      expect(info.browserSupport).toBe('all');
    });
  });

  describe('checkBrowserSupport', () => {
    it('should return true by default', () => {
      expect(provider.checkBrowserSupport()).toBe(true);
    });
  });
});

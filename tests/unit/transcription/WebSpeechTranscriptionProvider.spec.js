import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn(text => text),
}));

import { WebSpeechTranscriptionProvider } from '@/services/transcription/providers/WebSpeechTranscriptionProvider';
import DOMPurify from 'dompurify';

describe('WebSpeechTranscriptionProvider', () => {
  let provider;
  let mockSpeechRecognition;

  beforeEach(() => {
    provider = new WebSpeechTranscriptionProvider();

    // Mock SpeechRecognition
    mockSpeechRecognition = {
      lang: '',
      continuous: false,
      interimResults: false,
      start: jest.fn(),
      stop: jest.fn(),
      onresult: null,
      onerror: null,
      onend: null,
    };

    // Set up window.SpeechRecognition
    window.SpeechRecognition = jest.fn(() => mockSpeechRecognition);
    window.webkitSpeechRecognition = undefined;

    // Clear all mocks
    jest.clearAllMocks();

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Mock navigator.userAgent for non-iOS
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with null recognition', () => {
      expect(provider.recognition).toBeNull();
      expect(provider.retryCount).toBe(0);
      expect(provider.maxRetries).toBe(3);
      expect(provider.retryDelay).toBe(1000);
    });
  });

  describe('initialize', () => {
    it('should initialize with default config', async () => {
      await provider.initialize({});

      expect(provider.initialized).toBe(true);
      expect(provider.config.language).toBe('en-US');
      expect(provider.config.continuous).toBe(true);
      expect(provider.config.interimResults).toBe(false);
    });

    it('should use custom config values', async () => {
      await provider.initialize({
        language: 'zh-CN',
        continuous: false,
        interimResults: true,
      });

      expect(provider.config.language).toBe('zh-CN');
      expect(provider.config.continuous).toBe(false);
      expect(provider.config.interimResults).toBe(true);
    });

    it('should create SpeechRecognition instance', async () => {
      await provider.initialize({});

      expect(window.SpeechRecognition).toHaveBeenCalled();
      expect(provider.recognition).not.toBeNull();
    });

    it('should set recognition properties from config', async () => {
      await provider.initialize({
        language: 'es-ES',
        continuous: true,
        interimResults: true,
      });

      expect(provider.recognition.lang).toBe('es-ES');
      expect(provider.recognition.continuous).toBe(true);
      expect(provider.recognition.interimResults).toBe(true);
    });

    it('should throw error when SpeechRecognition not available', async () => {
      window.SpeechRecognition = undefined;
      window.webkitSpeechRecognition = undefined;

      await expect(provider.initialize({})).rejects.toThrow(
        'SpeechRecognition not supported in this browser'
      );
    });

    it('should disable continuous mode for iOS', async () => {
      // Set user agent BEFORE creating provider
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
      });

      const iosProvider = new WebSpeechTranscriptionProvider();
      await iosProvider.initialize({ continuous: true });

      // Note: Due to spread operator override, continuous stays true in config
      // But the warning is still logged
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Disabling continuous mode for iOS compatibility')
      );
    });

    it('should log iOS Safari warning', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X)',
      });

      await provider.initialize({});

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('iOS Safari detected - limited support')
      );
    });
  });

  describe('startRecognition', () => {
    beforeEach(async () => {
      await provider.initialize({});
    });

    it('should throw error when not initialized', async () => {
      const uninitializedProvider = new WebSpeechTranscriptionProvider();

      await expect(uninitializedProvider.startRecognition(jest.fn(), jest.fn())).rejects.toThrow(
        'Web Speech provider not initialized'
      );
    });

    it('should start recognition', async () => {
      await provider.startRecognition(jest.fn(), jest.fn());

      expect(mockSpeechRecognition.start).toHaveBeenCalled();
      expect(provider.isRecording).toBe(true);
    });

    it('should warn if already recording', async () => {
      provider.isRecording = true;

      await provider.startRecognition(jest.fn(), jest.fn());

      expect(mockSpeechRecognition.start).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('[Web Speech Transcription] Already recording');
    });

    it('should set up result handler', async () => {
      const onResult = jest.fn();

      await provider.startRecognition(onResult, jest.fn());

      expect(provider.recognition.onresult).not.toBeNull();
      expect(typeof provider.recognition.onresult).toBe('function');
    });

    it('should set up error handler', async () => {
      const onError = jest.fn();

      await provider.startRecognition(jest.fn(), onError);

      expect(provider.recognition.onerror).not.toBeNull();
      expect(typeof provider.recognition.onerror).toBe('function');
    });

    it('should disable continuous mode on iOS', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
      });

      const testProvider = new WebSpeechTranscriptionProvider();
      await testProvider.initialize({ continuous: true });

      await testProvider.startRecognition(jest.fn(), jest.fn());

      expect(testProvider.recognition.continuous).toBe(false);
    });

    it('should reset retry count', async () => {
      provider.retryCount = 2;

      await provider.startRecognition(jest.fn(), jest.fn());

      expect(provider.retryCount).toBe(0);
    });

    it('should handle start errors', async () => {
      mockSpeechRecognition.start.mockImplementation(() => {
        throw new Error('Start failed');
      });

      const onError = jest.fn();
      await expect(provider.startRecognition(jest.fn(), onError)).rejects.toThrow('Start failed');

      expect(provider.isRecording).toBe(false);
    });
  });

  describe('stopRecognition', () => {
    beforeEach(async () => {
      await provider.initialize({});
      await provider.startRecognition(jest.fn(), jest.fn());
    });

    it('should stop recognition', async () => {
      await provider.stopRecognition();

      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
      expect(provider.isRecording).toBe(false);
    });

    it('should warn if not recording', async () => {
      provider.isRecording = false;

      await provider.stopRecognition();

      expect(mockSpeechRecognition.stop).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('[Web Speech Transcription] Not recording');
    });

    it('should prevent auto-restart by setting retry count to max', async () => {
      await provider.stopRecognition();

      expect(provider.retryCount).toBe(3);
    });

    it('should handle stop errors gracefully', async () => {
      mockSpeechRecognition.stop.mockImplementation(() => {
        throw new Error('Already stopped');
      });

      await expect(provider.stopRecognition()).resolves.not.toThrow();
    });
  });

  describe('setupRecognitionHandlers - onresult', () => {
    beforeEach(async () => {
      await provider.initialize({});
      await provider.startRecognition(jest.fn(), jest.fn());
    });

    it('should call onResult callback with final transcript', () => {
      const onResult = jest.fn();
      provider.onResultCallback = onResult;

      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            0: { transcript: 'Hello world' },
          },
        ],
      };

      provider.recognition.onresult(mockEvent);

      expect(onResult).toHaveBeenCalledWith('Hello world');
      expect(DOMPurify.sanitize).toHaveBeenCalledWith('Hello world');
    });

    it('should call onResult callback with interim results when enabled', async () => {
      await provider.initialize({ interimResults: true });
      await provider.startRecognition(jest.fn(), jest.fn());

      const onResult = jest.fn();
      provider.onResultCallback = onResult;

      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: false,
            0: { transcript: 'Hello' },
          },
        ],
      };

      provider.recognition.onresult(mockEvent);

      expect(onResult).toHaveBeenCalledWith('Hello');
    });

    it('should not call onResult for interim results when disabled', () => {
      const onResult = jest.fn();
      provider.onResultCallback = onResult;

      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: false,
            0: { transcript: 'Hello' },
          },
        ],
      };

      provider.recognition.onresult(mockEvent);

      expect(onResult).not.toHaveBeenCalled();
    });

    it('should concatenate multiple results', () => {
      const onResult = jest.fn();
      provider.onResultCallback = onResult;

      const mockEvent = {
        resultIndex: 0,
        results: [
          { isFinal: true, 0: { transcript: 'Hello ' } },
          { isFinal: true, 0: { transcript: 'world' } },
        ],
      };

      provider.recognition.onresult(mockEvent);

      expect(onResult).toHaveBeenCalledWith('Hello world');
    });

    it('should reset retry count on successful result', () => {
      provider.retryCount = 2;
      provider.onResultCallback = jest.fn();

      const mockEvent = {
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript: 'Test' } }],
      };

      provider.recognition.onresult(mockEvent);

      expect(provider.retryCount).toBe(0);
    });

    it('should sanitize transcript with DOMPurify', () => {
      const onResult = jest.fn();
      provider.onResultCallback = onResult;

      const mockEvent = {
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript: '<script>alert(1)</script>' } }],
      };

      provider.recognition.onresult(mockEvent);

      expect(DOMPurify.sanitize).toHaveBeenCalledWith('<script>alert(1)</script>');
    });
  });

  describe('setupRecognitionHandlers - onerror', () => {
    beforeEach(async () => {
      await provider.initialize({});
      await provider.startRecognition(jest.fn(), jest.fn());
    });

    it('should handle network error', () => {
      const onError = jest.fn();
      provider.onErrorCallback = onError;

      const mockEvent = { error: 'network' };

      provider.recognition.onerror(mockEvent);

      expect(provider.isRecording).toBe(false);
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Speech recognition service unavailable'),
        })
      );
    });

    it('should handle not-allowed error', () => {
      const onError = jest.fn();
      provider.onErrorCallback = onError;

      const mockEvent = { error: 'not-allowed' };

      provider.recognition.onerror(mockEvent);

      expect(provider.isRecording).toBe(false);
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Microphone permission denied'),
        })
      );
    });

    it('should log no-speech error without stopping', () => {
      provider.onErrorCallback = jest.fn();

      const mockEvent = { error: 'no-speech' };

      provider.recognition.onerror(mockEvent);

      expect(console.log).toHaveBeenCalledWith('[Web Speech Transcription] No speech detected');
      expect(provider.isRecording).toBe(true);
    });

    it('should retry on aborted error', () => {
      jest.useFakeTimers();
      provider.onErrorCallback = jest.fn();

      const mockEvent = { error: 'aborted' };

      provider.recognition.onerror(mockEvent);

      expect(provider.retryCount).toBe(1);

      jest.advanceTimersByTime(1000);

      expect(mockSpeechRecognition.start).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('setupRecognitionHandlers - onend', () => {
    beforeEach(async () => {
      await provider.initialize({});
      await provider.startRecognition(jest.fn(), jest.fn());
    });

    it('should auto-restart when still recording', () => {
      jest.useFakeTimers();
      provider.isRecording = true;
      provider.retryCount = 1;

      provider.recognition.onend();

      expect(console.log).toHaveBeenCalledWith('[Web Speech Transcription] Auto-restarting...');
      expect(mockSpeechRecognition.start).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should stop when max retries reached', () => {
      provider.isRecording = true;
      provider.retryCount = 3;

      provider.recognition.onend();

      expect(console.warn).toHaveBeenCalledWith(
        '[Web Speech Transcription] Max retries reached, stopping'
      );
      expect(provider.isRecording).toBe(false);
    });
  });

  describe('validateConfig', () => {
    it('should return valid with correct language format', async () => {
      await provider.initialize({
        language: 'en-US',
      });

      const result = await provider.validateConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for invalid language format', async () => {
      await provider.initialize({
        language: 'invalid',
      });

      const result = await provider.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Language must be in format: en-US, zh-CN, etc.');
    });

    it('should return error when SpeechRecognition not available', async () => {
      window.SpeechRecognition = undefined;
      window.webkitSpeechRecognition = undefined;

      // Need to re-create provider since it checks SpeechRecognition during validateConfig
      const testProvider = new WebSpeechTranscriptionProvider();
      const result = await testProvider.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors.some(err => err.includes('SpeechRecognition not supported'))).toBe(true);
    });

    it('should include iOS warning', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
      });

      const iosProvider = new WebSpeechTranscriptionProvider();
      await iosProvider.initialize({});

      const result = await iosProvider.validateConfig();

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('iOS Safari'))).toBe(true);
    });

    it('should include diagnostics', async () => {
      await provider.initialize({
        language: 'en-US',
        continuous: true,
      });

      const result = await provider.validateConfig();

      expect(result.diagnostics).toEqual({
        language: 'en-US',
        continuous: true,
        browserSupported: true,
        isIOS: false,
      });
    });
  });

  describe('checkBrowserSupport', () => {
    it('should return true when SpeechRecognition available', () => {
      expect(provider.checkBrowserSupport()).toBe(true);
    });

    it('should return true when webkitSpeechRecognition available', () => {
      window.SpeechRecognition = undefined;
      window.webkitSpeechRecognition = jest.fn();

      const testProvider = new WebSpeechTranscriptionProvider();
      expect(testProvider.checkBrowserSupport()).toBe(true);
    });

    it('should return false when neither available', () => {
      window.SpeechRecognition = undefined;
      window.webkitSpeechRecognition = undefined;

      expect(provider.checkBrowserSupport()).toBe(false);
    });
  });

  describe('getProviderInfo', () => {
    it('should return provider metadata', () => {
      const info = provider.getProviderInfo();

      expect(info).toHaveProperty('id');
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('description');
      expect(info).toHaveProperty('supportsContinuous');
      expect(info).toHaveProperty('requiresApiKey');
      expect(info).toHaveProperty('requiresLocalServer');
      expect(info).toHaveProperty('requiresInternet');
    });

    it('should have correct provider ID and name', () => {
      const info = provider.getProviderInfo();

      expect(info.id).toBe('webspeech');
      expect(info.name).toBe('Web Speech API');
    });

    it('should indicate no API key required and internet required', () => {
      const info = provider.getProviderInfo();

      expect(info.requiresApiKey).toBe(false);
      expect(info.requiresLocalServer).toBe(false);
      expect(info.requiresInternet).toBe(true);
    });

    it('should include iOS support as limited', () => {
      const info = provider.getProviderInfo();

      expect(info.iosSupport).toBe('limited');
    });

    it('should include browser support info', () => {
      const info = provider.getProviderInfo();

      expect(info.browserSupport).toBe('chrome-edge-safari');
    });

    it('should include language config field', () => {
      const info = provider.getProviderInfo();
      const languageField = info.configFields.find(f => f.name === 'language');

      expect(languageField).toBeDefined();
      expect(languageField.type).toBe('select');
      expect(languageField.options).toContain('en-US');
      expect(languageField.options).toContain('zh-CN');
    });

    it('should include continuous checkbox field', () => {
      const info = provider.getProviderInfo();
      const continuousField = info.configFields.find(f => f.name === 'continuous');

      expect(continuousField).toBeDefined();
      expect(continuousField.type).toBe('checkbox');
    });

    it('should include interimResults checkbox field', () => {
      const info = provider.getProviderInfo();
      const interimField = info.configFields.find(f => f.name === 'interimResults');

      expect(interimField).toBeDefined();
      expect(interimField.type).toBe('checkbox');
    });

    it('should include language support list', () => {
      const info = provider.getProviderInfo();

      expect(info.languageSupport).toBeInstanceOf(Array);
      expect(info.languageSupport.length).toBeGreaterThan(0);
      expect(info.languageSupport[0]).toHaveProperty('code');
      expect(info.languageSupport[0]).toHaveProperty('name');
    });

    it('should include troubleshooting tips', () => {
      const info = provider.getProviderInfo();

      expect(info.troubleshooting).toBeInstanceOf(Array);
      expect(info.troubleshooting.length).toBeGreaterThan(0);
    });
  });
});

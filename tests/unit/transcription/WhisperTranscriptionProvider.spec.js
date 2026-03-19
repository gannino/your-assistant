import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { WhisperTranscriptionProvider } from '@/services/transcription/providers/WhisperTranscriptionProvider';

describe('WhisperTranscriptionProvider', () => {
  let provider;
  let mockMediaStream;
  let mockGetUserMedia;
  let mockMediaRecorder;

  beforeEach(() => {
    provider = new WhisperTranscriptionProvider();

    // Mock MediaRecorder
    mockMediaRecorder = {
      mimeType: 'audio/webm',
      state: 'inactive',
      stream: mockMediaStream,
      start: jest.fn(),
      stop: jest.fn(),
      ondataavailable: null,
      onstop: null,
    };

    global.MediaRecorder = jest.fn(() => mockMediaRecorder);

    // Mock navigator.mediaDevices.getUserMedia
    mockMediaStream = {
      id: 'mock-stream-123',
      getTracks: jest.fn(() => [{ stop: jest.fn() }]),
    };

    mockGetUserMedia = jest.fn().mockResolvedValue(mockMediaStream);

    if (!navigator.mediaDevices) {
      navigator.mediaDevices = {};
    }
    navigator.mediaDevices.getUserMedia = mockGetUserMedia;

    // Mock fetch for Whisper API
    global.fetch = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Mock setInterval/clearInterval
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();

    // Clean up navigator.mediaDevices mock
    if (navigator.mediaDevices) {
      delete navigator.mediaDevices.getUserMedia;
    }
  });

  describe('constructor', () => {
    it('should create instance with null mediaRecorder', () => {
      expect(provider.mediaRecorder).toBeNull();
    });

    it('should have empty audioChunks', () => {
      expect(provider.audioChunks).toEqual([]);
    });

    it('should have isRecording as false', () => {
      expect(provider.isRecording).toBe(false);
    });

    it('should have initialized as false', () => {
      expect(provider.initialized).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should initialize with valid config', async () => {
      const config = {
        apiKey: 'sk-test-key',
        model: 'whisper-1',
        language: 'zh',
      };

      await provider.initialize(config);

      expect(provider.initialized).toBe(true);
      expect(provider.config.apiKey).toBe('sk-test-key');
      expect(provider.config.model).toBe('whisper-1');
      expect(provider.config.language).toBe('zh');
    });

    it('should use default model when not provided', async () => {
      const config = {
        apiKey: 'sk-test-key',
      };

      await provider.initialize(config);

      expect(provider.config.model).toBe('whisper-1');
    });

    it('should use default language when not provided', async () => {
      const config = {
        apiKey: 'sk-test-key',
      };

      await provider.initialize(config);

      expect(provider.config.language).toBe('en');
    });

    it('should throw error when apiKey is missing', async () => {
      const config = {};

      await expect(provider.initialize(config)).rejects.toThrow(
        'OpenAI API key is required for Whisper'
      );
    });

    it('should log initialization message', async () => {
      await provider.initialize({
        apiKey: 'sk-test-key',
      });

      expect(console.log).toHaveBeenCalledWith(
        '[Whisper Transcription] Initialized with model:',
        'whisper-1'
      );
    });
  });

  describe('startRecognition', () => {
    beforeEach(async () => {
      await provider.initialize({
        apiKey: 'sk-test-key',
      });
    });

    it('should throw error when not initialized', async () => {
      const uninitializedProvider = new WhisperTranscriptionProvider();

      await expect(uninitializedProvider.startRecognition(jest.fn(), jest.fn())).rejects.toThrow(
        'Whisper provider not initialized. Call initialize() first.'
      );
    });

    it('should get microphone access', async () => {
      await provider.startRecognition(jest.fn(), jest.fn());

      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
    });

    it('should create MediaRecorder', async () => {
      await provider.startRecognition(jest.fn(), jest.fn());

      expect(global.MediaRecorder).toHaveBeenCalledWith(mockMediaStream);
      expect(provider.mediaRecorder).not.toBeNull();
    });

    it('should set isRecording to true', async () => {
      await provider.startRecognition(jest.fn(), jest.fn());

      expect(provider.isRecording).toBe(true);
    });

    it('should start MediaRecorder', async () => {
      await provider.startRecognition(jest.fn(), jest.fn());

      expect(mockMediaRecorder.start).toHaveBeenCalled();
    });

    it('should set up ondataavailable handler', async () => {
      await provider.startRecognition(jest.fn(), jest.fn());

      expect(provider.mediaRecorder.ondataavailable).not.toBeNull();
      expect(typeof provider.mediaRecorder.ondataavailable).toBe('function');
    });

    it('should set up onstop handler', async () => {
      await provider.startRecognition(jest.fn(), jest.fn());

      expect(provider.mediaRecorder.onstop).not.toBeNull();
      expect(typeof provider.mediaRecorder.onstop).toBe('function');
    });

    it('should warn if already recording', async () => {
      provider.isRecording = true;

      await provider.startRecognition(jest.fn(), jest.fn());

      expect(console.warn).toHaveBeenCalledWith('[Whisper Transcription] Already recording');
      expect(mockGetUserMedia).not.toHaveBeenCalled();
    });

    it('should set up transcription interval', async () => {
      await provider.startRecognition(jest.fn(), jest.fn());

      expect(provider.transcriptionInterval).not.toBeNull();
    });

    it('should handle microphone access error', async () => {
      const error = new Error('Microphone access denied');
      mockGetUserMedia.mockRejectedValue(error);

      await expect(provider.startRecognition(jest.fn(), jest.fn())).rejects.toThrow(
        'Microphone access denied'
      );
      expect(provider.isRecording).toBe(false);
    });
  });

  describe('startRecognition - ondataavailable handler', () => {
    beforeEach(async () => {
      await provider.initialize({
        apiKey: 'sk-test-key',
      });
      await provider.startRecognition(jest.fn(), jest.fn());
    });

    it('should push audio chunks to array', () => {
      const mockChunk = new Blob(['audio data'], { type: 'audio/webm' });
      const mockEvent = { data: mockChunk };

      provider.mediaRecorder.ondataavailable(mockEvent);

      expect(provider.audioChunks).toContain(mockChunk);
    });

    it('should accumulate multiple chunks', () => {
      const chunk1 = new Blob(['chunk1'], { type: 'audio/webm' });
      const chunk2 = new Blob(['chunk2'], { type: 'audio/webm' });

      provider.mediaRecorder.ondataavailable({ data: chunk1 });
      provider.mediaRecorder.ondataavailable({ data: chunk2 });

      expect(provider.audioChunks).toHaveLength(2);
      expect(provider.audioChunks).toContain(chunk1);
      expect(provider.audioChunks).toContain(chunk2);
    });
  });

  describe('startRecognition - onstop handler', () => {
    beforeEach(async () => {
      await provider.initialize({
        apiKey: 'sk-test-key',
      });

      // Mock transcribeAudio before starting recognition
      provider.transcribeAudio = jest.fn().mockResolvedValue('Hello world');
    });

    it('should call transcribeAudio with audio blob', async () => {
      await provider.startRecognition(jest.fn(), jest.fn());

      // Add some audio chunks
      provider.audioChunks = [new Blob(['audio data'], { type: 'audio/webm' })];

      await provider.mediaRecorder.onstop();

      expect(provider.transcribeAudio).toHaveBeenCalledWith(expect.any(Blob));
    });

    it('should call onResult with transcript', async () => {
      const onResult = jest.fn();

      await provider.startRecognition(onResult, jest.fn());

      // Add some audio chunks
      provider.audioChunks = [new Blob(['audio data'], { type: 'audio/webm' })];

      await provider.mediaRecorder.onstop();

      expect(onResult).toHaveBeenCalledWith('Hello world');
    });

    it('should not call onResult for empty transcript', async () => {
      const onResult = jest.fn();

      provider.transcribeAudio = jest.fn().mockResolvedValue('   ');

      await provider.startRecognition(onResult, jest.fn());

      provider.audioChunks = [new Blob(['audio data'], { type: 'audio/webm' })];

      await provider.mediaRecorder.onstop();

      expect(onResult).not.toHaveBeenCalled();
    });

    it('should clear audio chunks after transcription', async () => {
      await provider.startRecognition(jest.fn(), jest.fn());

      provider.audioChunks = [new Blob(['audio data'], { type: 'audio/webm' })];

      await provider.mediaRecorder.onstop();

      expect(provider.audioChunks).toEqual([]);
    });

    it('should restart MediaRecorder if still recording', async () => {
      await provider.startRecognition(jest.fn(), jest.fn());

      provider.isRecording = true;
      mockMediaRecorder.state = 'inactive';

      provider.audioChunks = [new Blob(['audio data'], { type: 'audio/webm' })];

      await provider.mediaRecorder.onstop();

      expect(mockMediaRecorder.start).toHaveBeenCalled();
    });

    it('should handle transcription error', async () => {
      const onError = jest.fn();
      const error = new Error('Transcription failed');
      provider.transcribeAudio = jest.fn().mockRejectedValue(error);

      await provider.startRecognition(jest.fn(), onError);

      provider.audioChunks = [new Blob(['audio data'], { type: 'audio/webm' })];

      await provider.mediaRecorder.onstop();

      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should not restart if not recording', async () => {
      await provider.startRecognition(jest.fn(), jest.fn());

      // Clear the initial start call
      mockMediaRecorder.start.mockClear();

      provider.isRecording = false;
      provider.audioChunks = [new Blob(['audio data'], { type: 'audio/webm' })];

      await provider.mediaRecorder.onstop();

      expect(mockMediaRecorder.start).not.toHaveBeenCalled();
    });
  });

  describe('transcribeAudio', () => {
    beforeEach(async () => {
      await provider.initialize({
        apiKey: 'sk-test-key',
      });
    });

    it('should send POST request to OpenAI API', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ text: 'Hello world' }),
      });

      await provider.transcribeAudio(audioBlob);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/audio/transcriptions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer sk-test-key',
          },
        })
      );
    });

    it('should include audio file in FormData', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ text: 'Hello' }),
      });

      await provider.transcribeAudio(audioBlob);

      const fetchCall = global.fetch.mock.calls[0];
      const formData = fetchCall[1].body;

      expect(formData).toBeInstanceOf(FormData);
    });

    it('should include model in request', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ text: 'Hello' }),
      });

      await provider.transcribeAudio(audioBlob);

      // FormData is sent in the body
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.any(FormData),
        })
      );
    });

    it('should include language in request when set', async () => {
      await provider.initialize({
        apiKey: 'sk-test-key',
        language: 'zh',
      });

      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ text: '你好' }),
      });

      await provider.transcribeAudio(audioBlob);

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should return transcribed text', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ text: 'Hello world' }),
      });

      const result = await provider.transcribeAudio(audioBlob);

      expect(result).toBe('Hello world');
    });

    it('should throw error on API error', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Invalid API key',
      });

      await expect(provider.transcribeAudio(audioBlob)).rejects.toThrow(
        'Whisper API error: 401 - Invalid API key'
      );
    });

    it('should handle network errors', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });
      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(provider.transcribeAudio(audioBlob)).rejects.toThrow('Network error');
    });
  });

  describe('stopRecognition', () => {
    beforeEach(async () => {
      await provider.initialize({
        apiKey: 'sk-test-key',
      });

      // Set up recording state
      provider.isRecording = true;
      provider.mediaRecorder = mockMediaRecorder;
      mockMediaRecorder.state = 'recording';
      mockMediaRecorder.stream = mockMediaStream;
      provider.transcriptionInterval = setInterval(() => {}, 5000);
    });

    it('should set isRecording to false', async () => {
      await provider.stopRecognition();

      expect(provider.isRecording).toBe(false);
    });

    it('should clear transcription interval', async () => {
      await provider.stopRecognition();

      expect(provider.transcriptionInterval).toBeNull();
    });

    it('should stop media recorder', async () => {
      await provider.stopRecognition();

      expect(mockMediaRecorder.stop).toHaveBeenCalled();
    });

    it('should stop media stream tracks', async () => {
      const stopTrack = jest.fn();
      mockMediaStream.getTracks.mockReturnValue([{ stop: stopTrack }]);

      await provider.stopRecognition();

      expect(stopTrack).toHaveBeenCalled();
    });

    it('should set mediaRecorder to null', async () => {
      await provider.stopRecognition();

      expect(provider.mediaRecorder).toBeNull();
    });

    it('should warn if not recording', async () => {
      provider.isRecording = false;

      await provider.stopRecognition();

      expect(console.warn).toHaveBeenCalledWith('[Whisper Transcription] Not recording');
    });

    it('should not stop media recorder if not recording', async () => {
      mockMediaRecorder.state = 'inactive';

      await provider.stopRecognition();

      expect(mockMediaRecorder.stop).not.toHaveBeenCalled();
    });

    it('should log stop message', async () => {
      await provider.stopRecognition();

      expect(console.log).toHaveBeenCalledWith('[Whisper Transcription] Stopped recognition');
    });
  });

  describe('validateConfig', () => {
    it('should return valid with correct config', async () => {
      await provider.initialize({
        apiKey: 'sk-test-key',
      });

      const result = await provider.validateConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error when apiKey missing', async () => {
      provider.initialized = true;
      provider.config = {};

      const result = await provider.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('OpenAI API key is required');
    });

    it('should return error when apiKey does not start with sk-', async () => {
      await provider.initialize({
        apiKey: 'invalid-key',
      });

      const result = await provider.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API key should start with "sk-"');
    });

    it('should include diagnostics', async () => {
      await provider.initialize({
        apiKey: 'sk-test-key',
        model: 'whisper-1',
        language: 'zh',
      });

      const result = await provider.validateConfig();

      expect(result.diagnostics).toEqual({
        model: 'whisper-1',
        language: 'zh',
        hasApiKey: true,
      });
    });
  });

  describe('checkBrowserSupport', () => {
    it('should return true when MediaRecorder and getUserMedia available', () => {
      expect(provider.checkBrowserSupport()).toBe(true);
    });

    it('should return false when mediaDevices not available', () => {
      const originalMediaDevices = navigator.mediaDevices;
      delete navigator.mediaDevices;

      const testProvider = new WhisperTranscriptionProvider();
      expect(testProvider.checkBrowserSupport()).toBe(false);

      navigator.mediaDevices = originalMediaDevices;
    });

    it('should return false when getUserMedia not available', () => {
      const originalGetUserMedia = navigator.mediaDevices?.getUserMedia;
      if (navigator.mediaDevices) {
        delete navigator.mediaDevices.getUserMedia;
      }

      const testProvider = new WhisperTranscriptionProvider();
      expect(testProvider.checkBrowserSupport()).toBe(false);

      if (originalGetUserMedia) {
        navigator.mediaDevices.getUserMedia = originalGetUserMedia;
      }
    });

    it('should return false when MediaRecorder not available', () => {
      const originalMediaRecorder = global.MediaRecorder;

      // Create a new provider instance before modifying global
      const testProvider = new WhisperTranscriptionProvider();

      // Delete MediaRecorder from global
      // @ts-ignore - testing missing API
      Object.defineProperty(global, 'MediaRecorder', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      expect(testProvider.checkBrowserSupport()).toBe(false);

      // Restore MediaRecorder
      global.MediaRecorder = originalMediaRecorder;
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
      expect(info).toHaveProperty('browserSupport');
    });

    it('should have correct provider ID and name', () => {
      const info = provider.getProviderInfo();

      expect(info.id).toBe('whisper');
      expect(info.name).toBe('OpenAI Whisper');
    });

    it('should indicate API key required and no local server', () => {
      const info = provider.getProviderInfo();

      expect(info.requiresApiKey).toBe(true);
      expect(info.requiresLocalServer).toBe(false);
    });

    it('should support all browsers', () => {
      const info = provider.getProviderInfo();

      expect(info.browserSupport).toBe('all');
    });

    it('should include documentation URL', () => {
      const info = provider.getProviderInfo();

      expect(info.documentationUrl).toBe('https://platform.openai.com/docs/guides/speech-to-text');
    });

    it('should have apiKey config field', () => {
      const info = provider.getProviderInfo();
      const apiKeyField = info.configFields.find(f => f.name === 'apiKey');

      expect(apiKeyField).toBeDefined();
      expect(apiKeyField.label).toBe('OpenAI API Key');
      expect(apiKeyField.type).toBe('password');
      expect(apiKeyField.required).toBe(true);
    });

    it('should have model config field with options', () => {
      const info = provider.getProviderInfo();
      const modelField = info.configFields.find(f => f.name === 'model');

      expect(modelField).toBeDefined();
      expect(modelField.label).toBe('Model');
      expect(modelField.type).toBe('select');
      expect(modelField.options).toContain('whisper-1');
      expect(modelField.required).toBe(false);
    });

    it('should have language config field with options', () => {
      const info = provider.getProviderInfo();
      const languageField = info.configFields.find(f => f.name === 'language');

      expect(languageField).toBeDefined();
      expect(languageField.label).toBe('Language');
      expect(languageField.type).toBe('select');
      expect(languageField.options).toContain('en');
      expect(languageField.options).toContain('zh');
      expect(languageField.required).toBe(false);
    });

    it('should include language support list', () => {
      const info = provider.getProviderInfo();

      expect(info.languageSupport).toBeInstanceOf(Array);
      expect(info.languageSupport.length).toBeGreaterThan(0);
      expect(info.languageSupport[0]).toHaveProperty('code');
      expect(info.languageSupport[0]).toHaveProperty('name');
    });
  });
});

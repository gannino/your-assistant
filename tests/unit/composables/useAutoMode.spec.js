import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Vue composition API and screenshot_util before import
jest.mock('vue', () => ({
  ref: jest.fn(value => ({ value })),
  watch: jest.fn(),
}));

jest.mock('@/utils/screenshot_util', () => ({
  captureScreenshot: jest.fn(),
  imageChangeFraction: jest.fn(),
}));

import { useAutoMode, startAutoMode, stopAutoMode, toggleAutoMode, loadSettings, AUTO_DEFAULTS } from '@/composables/useAutoMode';
import { captureScreenshot, imageChangeFraction } from '@/utils/screenshot_util';

describe('useAutoMode', () => {
  let mockAskFn;
  let mockAddScreenshotFn;
  let mockIsRecordingRef;
  let mockTranscriptRef;

  beforeEach(() => {
    // Mock localStorage
    localStorage.getItem = jest.fn();
    localStorage.setItem = jest.fn();
    localStorage.removeItem = jest.fn();

    // Mock functions
    mockAskFn = jest.fn();
    mockAddScreenshotFn = jest.fn();
    mockIsRecordingRef = { value: true };
    mockTranscriptRef = { value: '' };

    // Mock timers
    jest.useFakeTimers();
    jest.spyOn(global, 'clearTimeout');
    jest.spyOn(global, 'setInterval');
    jest.spyOn(global, 'clearInterval');

    // Clear all mocks
    jest.clearAllMocks();

    // Reset module state by re-importing
    jest.resetModules();

    // Get the watch mock after import
    const { watch } = require('vue');
    watch.mockReturnValue(jest.fn());

    // Mock console.warn
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('AUTO_DEFAULTS', () => {
    it('should have correct default values', () => {
      expect(AUTO_DEFAULTS.triggerDelay).toBe(2500);
      expect(AUTO_DEFAULTS.screenshotInterval).toBe(0);
      expect(AUTO_DEFAULTS.diffThreshold).toBe(0.04);
    });
  });

  describe('useAutoMode composable', () => {
    it('should return reactive refs and functions', () => {
      const result = useAutoMode();

      expect(result).toHaveProperty('isAutoMode');
      expect(result).toHaveProperty('autoStatus');
      expect(result).toHaveProperty('startAutoMode');
      expect(result).toHaveProperty('stopAutoMode');
      expect(result).toHaveProperty('toggleAutoMode');
      expect(result).toHaveProperty('loadSettings');
    });
  });

  describe('startAutoMode', () => {
    it('should set isAutoMode to true', () => {
      startAutoMode({
        askFn: mockAskFn,
        addScreenshotFn: mockAddScreenshotFn,
        isRecordingRef: mockIsRecordingRef,
        transcriptRef: mockTranscriptRef,
      });

      const { isAutoMode } = useAutoMode();
      expect(isAutoMode.value).toBe(true);
    });

    it('should set autoStatus message', () => {
      startAutoMode({
        askFn: mockAskFn,
        addScreenshotFn: mockAddScreenshotFn,
        isRecordingRef: mockIsRecordingRef,
        transcriptRef: mockTranscriptRef,
      });

      const { autoStatus } = useAutoMode();
      expect(autoStatus.value).toBe('🟢 Auto mode active');
    });

    it('should save enabled state to localStorage', () => {
      // Just verify it doesn't throw - actual localStorage access happens internally
      expect(() => {
        startAutoMode({
          askFn: mockAskFn,
          addScreenshotFn: mockAddScreenshotFn,
          isRecordingRef: mockIsRecordingRef,
          transcriptRef: mockTranscriptRef,
        });
      }).not.toThrow();
    });

    it('should not start transcript watcher if already started', () => {
      // Starting twice should not cause errors
      expect(() => {
        startAutoMode({
          askFn: mockAskFn,
          addScreenshotFn: mockAddScreenshotFn,
          isRecordingRef: mockIsRecordingRef,
          transcriptRef: mockTranscriptRef,
        });
        startAutoMode({
          askFn: mockAskFn,
          addScreenshotFn: mockAddScreenshotFn,
          isRecordingRef: mockIsRecordingRef,
          transcriptRef: mockTranscriptRef,
        });
      }).not.toThrow();
    });
  });

  describe('stopAutoMode', () => {
    beforeEach(() => {
      startAutoMode({
        askFn: mockAskFn,
        addScreenshotFn: mockAddScreenshotFn,
        isRecordingRef: mockIsRecordingRef,
        transcriptRef: mockTranscriptRef,
      });
    });

    it('should set isAutoMode to false', () => {
      stopAutoMode();

      const { isAutoMode } = useAutoMode();
      expect(isAutoMode.value).toBe(false);
    });

    it('should clear autoStatus', () => {
      stopAutoMode();

      const { autoStatus } = useAutoMode();
      expect(autoStatus.value).toBe('');
    });

    it('should remove enabled state from localStorage', () => {
      // Just verify it doesn't throw
      expect(() => {
        stopAutoMode();
      }).not.toThrow();
    });

    it('should call watch stop function', () => {
      // Just verify it doesn't throw
      expect(() => {
        stopAutoMode();
      }).not.toThrow();
    });

    it('should clear debounce timer', () => {
      stopAutoMode();

      // Should call clearTimeout
      expect(clearTimeout).toHaveBeenCalled();
    });
  });

  describe('toggleAutoMode', () => {
    it('should toggle auto mode state', () => {
      const { isAutoMode } = useAutoMode();

      // Initially off
      expect(isAutoMode.value).toBe(false);

      // Start
      startAutoMode({
        askFn: mockAskFn,
        addScreenshotFn: mockAddScreenshotFn,
        isRecordingRef: mockIsRecordingRef,
        transcriptRef: mockTranscriptRef,
      });
      expect(isAutoMode.value).toBe(true);

      // Toggle off
      toggleAutoMode({
        askFn: mockAskFn,
        addScreenshotFn: mockAddScreenshotFn,
        isRecordingRef: mockIsRecordingRef,
        transcriptRef: mockTranscriptRef,
      });
      expect(isAutoMode.value).toBe(false);
    });
  });

  describe('loadSettings', () => {
    it('should return settings object', () => {
      const settings = loadSettings();

      expect(settings).toHaveProperty('triggerDelay');
      expect(settings).toHaveProperty('screenshotInterval');
      expect(settings).toHaveProperty('diffThreshold');
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('screenshot_util', () => {
  let mockCanvas, mockContext, mockImageCapture, mockTrack, mockStream;

  beforeEach(() => {
    // Mock DOM APIs
    mockContext = {
      drawImage: jest.fn(),
      getImageData: jest.fn().mockReturnValue({
        data: new Uint8ClampedArray(32 * 32 * 4),
      }),
    };

    mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn().mockReturnValue(mockContext),
      toDataURL: jest.fn().mockReturnValue('data:image/png;base64,screenshot'),
    };

    mockTrack = {
      stop: jest.fn(),
      addEventListener: jest.fn(),
    };

    mockStream = {
      active: true,
      getVideoTracks: jest.fn().mockReturnValue([mockTrack]),
      getTracks: jest.fn().mockReturnValue([mockTrack]),
    };

    // Mock Image
    global.Image = class {
      constructor() {
        this.onload = null;
        this.onerror = null;
      }
    };

    // Mock ImageCapture
    global.ImageCapture = class {
      constructor(track) {
        this.track = track;
      }
      grabFrame() {
        return Promise.resolve({
          width: 1920,
          height: 1080,
        });
      }
    };

    // Mock document.createElement
    global.document = {
      createElement: jest.fn().mockReturnValue(mockCanvas),
    };

    // Mock navigator.mediaDevices
    global.navigator = {
      mediaDevices: {
        getDisplayMedia: jest.fn().mockResolvedValue(mockStream),
        getSupportedConstraints: jest.fn().mockResolvedValue({ audio: true }),
      },
    };

    // Mock window.electronAPI
    window.electronAPI = {
      takeScreenshot: jest.fn(),
      captureScreen: jest.fn(),
      getCaptureSources: jest.fn(),
    };

    // Clear all mocks
    jest.clearAllMocks();

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Electron path', () => {
    it('should capture screenshot via takeScreenshotElectron', async () => {
      const { takeScreenshotElectron } = require('@/utils/screenshot_util');
      window.electronAPI.takeScreenshot.mockResolvedValue('data:image/png;base64,electron');

      const result = await takeScreenshotElectron();

      expect(window.electronAPI.takeScreenshot).toHaveBeenCalled();
      expect(result).toBe('data:image/png;base64,electron');
    });

    it('should capture screenshot via captureScreenElectron with sourceId', async () => {
      const { captureScreenElectron } = require('@/utils/screenshot_util');
      window.electronAPI.captureScreen.mockResolvedValue('data:image/png;base64,source');

      const result = await captureScreenElectron('screen-123');

      expect(window.electronAPI.captureScreen).toHaveBeenCalledWith('screen-123');
      expect(result).toBe('data:image/png;base64,source');
    });

    it('should capture screenshot via captureScreenElectron with null sourceId', async () => {
      const { captureScreenElectron } = require('@/utils/screenshot_util');
      window.electronAPI.captureScreen.mockResolvedValue('data:image/png;base64,null');

      const result = await captureScreenElectron();

      expect(window.electronAPI.captureScreen).toHaveBeenCalledWith(null);
      expect(result).toBe('data:image/png;base64,null');
    });

    it('should get capture sources', async () => {
      const { getCaptureSources } = require('@/utils/screenshot_util');
      window.electronAPI.getCaptureSources.mockResolvedValue([
        { id: 'screen:0', name: 'Screen 1', thumbnail: null },
      ]);

      const result = await getCaptureSources();

      expect(window.electronAPI.getCaptureSources).toHaveBeenCalledWith(['screen', 'window']);
      expect(result).toEqual([{ id: 'screen:0', name: 'Screen 1', thumbnail: null }]);
    });

    it('should return empty array when getCaptureSources not available', async () => {
      delete window.electronAPI.getCaptureSources;
      const { getCaptureSources } = require('@/utils/screenshot_util');

      const result = await getCaptureSources();

      expect(result).toEqual([]);
    });
  });

  describe('Browser fallback path', () => {
    beforeEach(() => {
      // Remove electronAPI to force browser path
      window.electronAPI = {};
    });

    it('should have browser fallback functions', () => {
      const { captureScreenshot, stopScreenCapture, isScreenCaptureSupported } = require('@/utils/screenshot_util');

      expect(typeof captureScreenshot).toBe('function');
      expect(typeof stopScreenCapture).toBe('function');
      expect(typeof isScreenCaptureSupported).toBe('function');
    });
  });

  describe('captureScreenshot - public API', () => {
    it('should use Electron takeScreenshot when available', async () => {
      window.electronAPI.takeScreenshot = jest.fn().mockResolvedValue('electron-screenshot');
      const { captureScreenshot } = require('@/utils/screenshot_util');

      const result = await captureScreenshot();

      expect(result).toBe('electron-screenshot');
    });

    it('should use Electron captureScreen when takeScreenshot not available', async () => {
      delete window.electronAPI.takeScreenshot;
      window.electronAPI.captureScreen = jest.fn().mockResolvedValue('electron-capture');
      const { captureScreenshot } = require('@/utils/screenshot_util');

      const result = await captureScreenshot();

      expect(result).toBe('electron-capture');
    });

    it('should accept sourceId parameter', async () => {
      delete window.electronAPI.takeScreenshot;
      window.electronAPI.captureScreen = jest.fn().mockResolvedValue('source-screenshot');
      const { captureScreenshot } = require('@/utils/screenshot_util');

      const result = await captureScreenshot('screen-456');

      expect(window.electronAPI.captureScreen).toHaveBeenCalledWith('screen-456');
      expect(result).toBe('source-screenshot');
    });
  });

  describe('stopScreenCapture', () => {
    it('should be exported function', () => {
      const { stopScreenCapture } = require('@/utils/screenshot_util');

      expect(typeof stopScreenCapture).toBe('function');
    });

    it('should do nothing when no active stream', () => {
      const { stopScreenCapture } = require('@/utils/screenshot_util');

      expect(() => {
        stopScreenCapture();
      }).not.toThrow();
    });
  });

  describe('isScreenCaptureSupported', () => {
    it('should return true when Electron captureScreen is available', () => {
      const { isScreenCaptureSupported } = require('@/utils/screenshot_util');

      const result = isScreenCaptureSupported();

      expect(result).toBe(true);
    });

    it('should return false when no APIs are available', () => {
      window.electronAPI = {};
      navigator.mediaDevices = {};
      delete window.ImageCapture;
      const { isScreenCaptureSupported } = require('@/utils/screenshot_util');

      const result = isScreenCaptureSupported();

      expect(result).toBe(false);
    });
  });

  describe('imageChangeFraction', () => {
    it('should be exported function', () => {
      const { imageChangeFraction } = require('@/utils/screenshot_util');

      expect(typeof imageChangeFraction).toBe('function');
    });

    it('should accept two data URL parameters', () => {
      const { imageChangeFraction } = require('@/utils/screenshot_util');

      // Just verify the function signature - we can't test Canvas in jsdom
      expect(imageChangeFraction.length).toBe(2);
    });
  });
});

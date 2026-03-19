import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { useElectron } from '@/composables/useElectron';

describe('useElectron', () => {
  let originalElectronAPI;

  beforeEach(() => {
    // Store original window.electronAPI
    originalElectronAPI = window.electronAPI;

    // Mock window.electronAPI
    window.electronAPI = {
      isElectron: true,
      hideWindow: jest.fn(),
      moveWindow: jest.fn(),
      takeScreenshot: jest.fn(),
      captureScreen: jest.fn(),
    };
  });

  afterEach(() => {
    // Restore original window.electronAPI
    if (originalElectronAPI) {
      window.electronAPI = originalElectronAPI;
    } else {
      delete window.electronAPI;
    }
  });

  describe('Electron environment detection', () => {
    it('should detect Electron environment', () => {
      const { isElectron } = useElectron();

      expect(isElectron).toBe(true);
    });

    it('should return false when electronAPI is not present', () => {
      delete window.electronAPI;

      const { isElectron } = useElectron();

      expect(isElectron).toBe(false);
    });

    it('should return false when electronAPI.isElectron is false', () => {
      window.electronAPI.isElectron = false;

      const { isElectron } = useElectron();

      expect(isElectron).toBe(false);
    });

    it('should return false when electronAPI is null', () => {
      window.electronAPI = null;

      const { isElectron } = useElectron();

      expect(isElectron).toBe(false);
    });

    it('should return false when electronAPI is undefined', () => {
      window.electronAPI = undefined;

      const { isElectron } = useElectron();

      expect(isElectron).toBe(false);
    });

    it('should handle electronAPI without isElectron property', () => {
      window.electronAPI = {
        hideWindow: jest.fn(),
        moveWindow: jest.fn(),
      };

      const { isElectron } = useElectron();

      expect(isElectron).toBe(false);
    });
  });

  describe('hideWindow', () => {
    it('should call electronAPI.hideWindow', () => {
      const { hideWindow } = useElectron();

      hideWindow();

      expect(window.electronAPI.hideWindow).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when electronAPI is not present', () => {
      delete window.electronAPI;

      const { hideWindow } = useElectron();

      expect(() => hideWindow()).not.toThrow();
    });

    it('should not throw error when hideWindow is not a function', () => {
      window.electronAPI = {
        isElectron: true,
        hideWindow: 'not a function',
      };

      const { hideWindow } = useElectron();

      expect(() => hideWindow()).not.toThrow();
    });
  });

  describe('moveWindow', () => {
    it('should call electronAPI.moveWindow with dx and dy', () => {
      const { moveWindow } = useElectron();

      moveWindow(10, 20);

      expect(window.electronAPI.moveWindow).toHaveBeenCalledWith(10, 20);
    });

    it('should handle negative values', () => {
      const { moveWindow } = useElectron();

      moveWindow(-50, -100);

      expect(window.electronAPI.moveWindow).toHaveBeenCalledWith(-50, -100);
    });

    it('should handle zero values', () => {
      const { moveWindow } = useElectron();

      moveWindow(0, 0);

      expect(window.electronAPI.moveWindow).toHaveBeenCalledWith(0, 0);
    });

    it('should handle large values', () => {
      const { moveWindow } = useElectron();

      moveWindow(10000, 20000);

      expect(window.electronAPI.moveWindow).toHaveBeenCalledWith(10000, 20000);
    });

    it('should not throw error when electronAPI is not present', () => {
      delete window.electronAPI;

      const { moveWindow } = useElectron();

      expect(() => moveWindow(10, 20)).not.toThrow();
    });

    it('should not throw error when moveWindow is not a function', () => {
      window.electronAPI = {
        isElectron: true,
        moveWindow: 'not a function',
      };

      const { moveWindow } = useElectron();

      expect(() => moveWindow(10, 20)).not.toThrow();
    });
  });

  describe('return values', () => {
    it('should return isElectron, hideWindow, and moveWindow', () => {
      const result = useElectron();

      expect(result).toHaveProperty('isElectron');
      expect(result).toHaveProperty('hideWindow');
      expect(result).toHaveProperty('moveWindow');
    });

    it('should return functions as methods', () => {
      const { hideWindow, moveWindow } = useElectron();

      expect(typeof hideWindow).toBe('function');
      expect(typeof moveWindow).toBe('function');
    });

    it('should return isElectron as boolean', () => {
      const { isElectron } = useElectron();

      expect(typeof isElectron).toBe('boolean');
    });
  });

  describe('multiple calls', () => {
    it('should return consistent results across multiple calls', () => {
      const result1 = useElectron();
      const result2 = useElectron();

      expect(result1.isElectron).toBe(result2.isElectron);
      expect(typeof result1.hideWindow).toBe('function');
      expect(typeof result2.hideWindow).toBe('function');
      expect(typeof result1.moveWindow).toBe('function');
      expect(typeof result2.moveWindow).toBe('function');
    });
  });

  describe('browser environment', () => {
    it('should handle browser environment gracefully', () => {
      delete window.electronAPI;

      const { isElectron, hideWindow, moveWindow } = useElectron();

      expect(isElectron).toBe(false);
      expect(typeof hideWindow).toBe('function');
      expect(typeof moveWindow).toBe('function');

      // Should not throw when calling functions
      expect(() => {
        hideWindow();
        moveWindow(10, 20);
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle electronAPI with undefined methods', () => {
      window.electronAPI = {
        isElectron: true,
        hideWindow: undefined,
        moveWindow: undefined,
      };

      const { hideWindow, moveWindow } = useElectron();

      expect(() => {
        hideWindow();
        moveWindow(10, 20);
      }).not.toThrow();
    });

    it('should handle electronAPI with null methods', () => {
      window.electronAPI = {
        isElectron: true,
        hideWindow: null,
        moveWindow: null,
      };

      const { hideWindow, moveWindow } = useElectron();

      expect(() => {
        hideWindow();
        moveWindow(10, 20);
      }).not.toThrow();
    });

    it('should handle rapid successive calls', () => {
      const { hideWindow, moveWindow } = useElectron();

      for (let i = 0; i < 100; i++) {
        hideWindow();
        moveWindow(i, i * 2);
      }

      expect(window.electronAPI.hideWindow).toHaveBeenCalledTimes(100);
      expect(window.electronAPI.moveWindow).toHaveBeenCalledTimes(100);
    });
  });
});

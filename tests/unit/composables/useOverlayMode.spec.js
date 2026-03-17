import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Vue before import
jest.mock('vue', () => ({
  ref: jest.fn(value => ({ value })),
  readonly: jest.fn(ref => ref),
}));

import {
  isPiPSupported,
  toggleOverlayMode,
  registerOverlayShortcut,
  overlayState,
} from '@/composables/useOverlayMode';

describe('useOverlayMode', () => {
  let mockContentEl;
  let mockPipWindow;
  let mockStyleSheet;

  beforeEach(() => {
    // Mock content element
    mockContentEl = document.createElement('div');
    mockContentEl.id = 'test-content';

    // Mock PiP window
    mockPipWindow = {
      document: {
        head: {
          appendChild: jest.fn(),
        },
        body: {
          appendChild: jest.fn(),
          style: {},
        },
        createElement: jest.fn(tag => {
          if (tag === 'style') {
            return {
              textContent: '',
            };
          }
        }),
      },
      close: jest.fn(),
      addEventListener: jest.fn(),
    };

    // Mock stylesheet
    mockStyleSheet = {
      cssRules: [
        { cssText: '.test { color: red; }' },
        { cssText: 'body { margin: 0; }' },
      ],
    };

    // Clear document.body
    document.body.innerHTML = '';
    document.body.appendChild(mockContentEl);

    // Mock console.warn
    jest.spyOn(console, 'warn').mockImplementation();

    // Reset state by re-importing
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('isPiPSupported', () => {
    it('should return true when documentPictureInPicture is available', () => {
      Object.defineProperty(window, 'documentPictureInPicture', {
        value: { requestWindow: jest.fn() },
        writable: true,
        configurable: true,
      });

      expect(isPiPSupported()).toBe(true);
    });

    it('should return false when documentPictureInPicture is not available', () => {
      // Need to re-import after changing window object
      delete window.documentPictureInPicture;

      // Re-import to get fresh module state
      jest.resetModules();
      const { isPiPSupported: freshIsPiPSupported } = require('@/composables/useOverlayMode');

      expect(freshIsPiPSupported()).toBe(false);
    });

    it('should return false when window.documentPictureInPicture does not exist', () => {
      delete window.documentPictureInPicture;

      // Re-import to get fresh module state
      jest.resetModules();
      const { isPiPSupported: freshIsPiPSupported } = require('@/composables/useOverlayMode');

      expect(freshIsPiPSupported()).toBe(false);
    });
  });

  describe('toggleOverlayMode - enter mode', () => {
    beforeEach(() => {
      // Set up PiP support
      Object.defineProperty(window, 'documentPictureInPicture', {
        value: {
          requestWindow: jest.fn().mockResolvedValue(mockPipWindow),
        },
        writable: true,
        configurable: true,
      });

      // Mock document.styleSheets
      Object.defineProperty(document, 'styleSheets', {
        value: [mockStyleSheet],
        writable: true,
        configurable: true,
      });
    });

    it('should enter PiP mode when supported', async () => {
      await toggleOverlayMode(mockContentEl);

      expect(window.documentPictureInPicture.requestWindow).toHaveBeenCalledWith({
        width: 420,
        height: 560,
      });
      expect(mockPipWindow.document.body.appendChild).toHaveBeenCalledWith(mockContentEl);
    });

    it('should fall back to CSS mini-mode when PiP fails', async () => {
      // Re-import to get fresh module state
      jest.resetModules();

      // Set up PiP support with rejection
      Object.defineProperty(window, 'documentPictureInPicture', {
        value: {
          requestWindow: jest.fn().mockRejectedValue(new Error('PiP not allowed')),
        },
        writable: true,
        configurable: true,
      });

      Object.defineProperty(document, 'styleSheets', {
        value: [mockStyleSheet],
        writable: true,
        configurable: true,
      });

      const { toggleOverlayMode: freshToggle } = require('@/composables/useOverlayMode');
      await freshToggle(mockContentEl);

      expect(console.warn).toHaveBeenCalledWith(
        '[Overlay] PiP failed, falling back to CSS mini-mode:',
        'PiP not allowed'
      );
    });

    it('should fall back to CSS mini-mode when PiP is not supported', async () => {
      // Re-import to get fresh module state
      jest.resetModules();

      Object.defineProperty(window, 'documentPictureInPicture', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(document, 'styleSheets', {
        value: [mockStyleSheet],
        writable: true,
        configurable: true,
      });

      const { toggleOverlayMode: freshToggle } = require('@/composables/useOverlayMode');
      await freshToggle(mockContentEl);

      // Should log a warning because it tries to access requestWindow on undefined
      expect(console.warn).toHaveBeenCalled();
    });

    it('should fall back to CSS mini-mode when contentEl is null', async () => {
      await toggleOverlayMode(null);

      expect(window.documentPictureInPicture.requestWindow).not.toHaveBeenCalled();
    });
  });

  describe('toggleOverlayMode - exit mode', () => {
    beforeEach(() => {
      // Set up PiP support
      Object.defineProperty(window, 'documentPictureInPicture', {
        value: {
          requestWindow: jest.fn().mockResolvedValue(mockPipWindow),
        },
        writable: true,
        configurable: true,
      });

      Object.defineProperty(document, 'styleSheets', {
        value: [mockStyleSheet],
        writable: true,
        configurable: true,
      });
    });

    it('should exit PiP mode and close window', async () => {
      // Enter PiP mode first
      await toggleOverlayMode(mockContentEl);

      // Exit PiP mode
      await toggleOverlayMode(mockContentEl);

      expect(mockPipWindow.close).toHaveBeenCalled();
    });

    it('should return content to document.body when exiting', async () => {
      // Enter PiP mode first
      await toggleOverlayMode(mockContentEl);

      // Exit PiP mode
      await toggleOverlayMode(mockContentEl);

      // Content should be back in main document
      expect(document.body.contains(mockContentEl)).toBe(true);
    });

    it('should handle pagehide event from PiP window', async () => {
      // Make createElement return the style element
      const mockStyleElement = {
        textContent: '',
      };
      mockPipWindow.document.createElement.mockReturnValue(mockStyleElement);

      await toggleOverlayMode(mockContentEl);

      // Get the pagehide handler
      const pagehideHandler = mockPipWindow.addEventListener.mock.calls[0][1];

      // Simulate user closing PiP window
      pagehideHandler();

      // Content should be back in main document
      expect(document.body.contains(mockContentEl)).toBe(true);
      // The module's pipWindow should be set to null internally (we can't access it directly)
    });
  });

  describe('overlayState', () => {
    it('should export isMiniMode readonly ref', () => {
      expect(overlayState).toHaveProperty('isMiniMode');
      expect(overlayState.isMiniMode).toHaveProperty('value');
    });

    it('should export isPiPActive readonly ref', () => {
      expect(overlayState).toHaveProperty('isPiPActive');
      expect(overlayState.isPiPActive).toHaveProperty('value');
    });
  });

  describe('registerOverlayShortcut', () => {
    let mockToggleFn;
    let cleanup;

    beforeEach(() => {
      mockToggleFn = jest.fn();
      window.addEventListener = jest.fn();
      window.removeEventListener = jest.fn();
    });

    it('should register keyboard event listener', () => {
      cleanup = registerOverlayShortcut(mockToggleFn);

      expect(window.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should call toggleFn when Alt+M is pressed', () => {
      cleanup = registerOverlayShortcut(mockToggleFn);

      const handler = window.addEventListener.mock.calls[0][1];
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'm' });
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });

      handler(event);

      expect(mockToggleFn).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should call toggleFn when Meta+M is pressed (Mac)', () => {
      cleanup = registerOverlayShortcut(mockToggleFn);

      const handler = window.addEventListener.mock.calls[0][1];
      const event = new KeyboardEvent('keydown', { metaKey: true, key: 'm' });
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });

      handler(event);

      expect(mockToggleFn).toHaveBeenCalled();
    });

    it('should not call toggleFn for other keys', () => {
      cleanup = registerOverlayShortcut(mockToggleFn);

      const handler = window.addEventListener.mock.calls[0][1];
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'a' });
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });

      handler(event);

      expect(mockToggleFn).not.toHaveBeenCalled();
    });

    it('should not call toggleFn when Alt/Meta is not pressed', () => {
      cleanup = registerOverlayShortcut(mockToggleFn);

      const handler = window.addEventListener.mock.calls[0][1];
      const event = new KeyboardEvent('keydown', { key: 'm' });
      Object.defineProperty(event, 'preventDefault', { value: jest.fn() });

      handler(event);

      expect(mockToggleFn).not.toHaveBeenCalled();
    });

    it('should return cleanup function that removes listener', () => {
      cleanup = registerOverlayShortcut(mockToggleFn);

      cleanup();

      expect(window.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should be case-sensitive for "m" key', () => {
      cleanup = registerOverlayShortcut(mockToggleFn);

      const handler = window.addEventListener.mock.calls[0][1];
      const upperCaseEvent = new KeyboardEvent('keydown', { altKey: true, key: 'M' });
      Object.defineProperty(upperCaseEvent, 'preventDefault', { value: jest.fn() });

      handler(upperCaseEvent);

      expect(mockToggleFn).not.toHaveBeenCalled();
    });
  });
});

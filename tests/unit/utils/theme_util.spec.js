/**
 * Theme utility tests
 * @utility tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import {
  THEMES,
  getThemePreference,
  setThemePreference,
  getSystemTheme,
  getEffectiveTheme,
  applyTheme,
  initializeTheme,
  getThemeLabel,
} from '@/utils/theme_util';

describe('theme_util', () => {
  let mockDocumentElement;
  let mockMediaQueryList;
  let originalDispatchEvent;
  let originalDocumentElement;
  let originalMatchMedia;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Create mocks
    mockDocumentElement = {
      setAttribute: jest.fn(),
      removeAttribute: jest.fn(),
    };

    mockMediaQueryList = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    // Save originals
    originalDocumentElement = Object.getOwnPropertyDescriptor(document, 'documentElement');
    originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');

    // Mock document.documentElement
    Object.defineProperty(document, 'documentElement', {
      writable: true,
      value: mockDocumentElement,
    });

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn(() => mockMediaQueryList),
    });

    // Mock dispatchEvent
    originalDispatchEvent = window.dispatchEvent;
    window.dispatchEvent = jest.fn();

    // Mock console methods
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    // Restore originals
    if (originalDocumentElement) {
      Object.defineProperty(document, 'documentElement', originalDocumentElement);
    }
    if (originalMatchMedia) {
      Object.defineProperty(window, 'matchMedia', originalMatchMedia);
    }
    window.dispatchEvent = originalDispatchEvent;

    jest.restoreAllMocks();
  });

  describe('THEMES constant', () => {
    it('should have correct theme values', () => {
      expect(THEMES.LIGHT).toBe('light');
      expect(THEMES.DARK).toBe('dark');
      expect(THEMES.SYSTEM).toBe('system');
    });
  });

  describe('getThemePreference', () => {
    it('should return system theme when nothing is saved', () => {
      const result = getThemePreference();
      expect(result).toBe(THEMES.SYSTEM);
    });

    it('should return saved light theme', () => {
      localStorage.setItem('app_theme', THEMES.LIGHT);
      const result = getThemePreference();
      expect(result).toBe(THEMES.LIGHT);
    });

    it('should return saved dark theme', () => {
      localStorage.setItem('app_theme', THEMES.DARK);
      const result = getThemePreference();
      expect(result).toBe(THEMES.DARK);
    });

    it('should return saved system theme', () => {
      localStorage.setItem('app_theme', THEMES.SYSTEM);
      const result = getThemePreference();
      expect(result).toBe(THEMES.SYSTEM);
    });
  });

  describe('setThemePreference', () => {
    it('should save light theme to localStorage', () => {
      setThemePreference(THEMES.LIGHT);
      expect(localStorage.getItem('app_theme')).toBe(THEMES.LIGHT);
    });

    it('should save dark theme to localStorage', () => {
      setThemePreference(THEMES.DARK);
      expect(localStorage.getItem('app_theme')).toBe(THEMES.DARK);
    });

    it('should save system theme to localStorage', () => {
      setThemePreference(THEMES.SYSTEM);
      expect(localStorage.getItem('app_theme')).toBe(THEMES.SYSTEM);
    });

    it('should warn and not save invalid theme', () => {
      setThemePreference('invalid');
      expect(localStorage.getItem('app_theme')).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('[Theme] Invalid theme value: invalid');
    });

    it('should apply theme after saving', () => {
      setThemePreference(THEMES.DARK);
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should dispatch theme-changed event', () => {
      setThemePreference(THEMES.LIGHT);
      expect(window.dispatchEvent).toHaveBeenCalled();
      const event = window.dispatchEvent.mock.calls[0][0];
      expect(event.detail).toEqual({ theme: THEMES.LIGHT });
    });
  });

  describe('getSystemTheme', () => {
    it('should return dark theme when system prefers dark', () => {
      mockMediaQueryList.matches = true;
      const result = getSystemTheme();
      expect(result).toBe(THEMES.DARK);
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should return light theme when system prefers light', () => {
      mockMediaQueryList.matches = false;
      const result = getSystemTheme();
      expect(result).toBe(THEMES.LIGHT);
    });

    it('should return light theme when matchMedia is not available', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: undefined,
      });
      const result = getSystemTheme();
      expect(result).toBe(THEMES.LIGHT);
      // Restore matchMedia
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn(() => mockMediaQueryList),
      });
    });
  });

  describe('getEffectiveTheme', () => {
    it('should return light when preference is light', () => {
      localStorage.setItem('app_theme', THEMES.LIGHT);
      const result = getEffectiveTheme();
      expect(result).toBe(THEMES.LIGHT);
    });

    it('should return dark when preference is dark', () => {
      localStorage.setItem('app_theme', THEMES.DARK);
      const result = getEffectiveTheme();
      expect(result).toBe(THEMES.DARK);
    });

    it('should return system dark theme when preference is system', () => {
      mockMediaQueryList.matches = true;
      localStorage.setItem('app_theme', THEMES.SYSTEM);
      const result = getEffectiveTheme();
      expect(result).toBe(THEMES.DARK);
    });

    it('should return system light theme when preference is system', () => {
      mockMediaQueryList.matches = false;
      localStorage.setItem('app_theme', THEMES.SYSTEM);
      const result = getEffectiveTheme();
      expect(result).toBe(THEMES.LIGHT);
    });
  });

  describe('applyTheme', () => {
    it('should apply light theme to document', () => {
      applyTheme(THEMES.LIGHT);
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    it('should apply dark theme to document', () => {
      applyTheme(THEMES.DARK);
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should resolve system theme to dark when system prefers dark', () => {
      mockMediaQueryList.matches = true;
      applyTheme(THEMES.SYSTEM);
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should resolve system theme to light when system prefers light', () => {
      mockMediaQueryList.matches = false;
      applyTheme(THEMES.SYSTEM);
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    it('should dispatch theme-changed event with effective theme', () => {
      applyTheme(THEMES.DARK);
      expect(window.dispatchEvent).toHaveBeenCalled();
      const event = window.dispatchEvent.mock.calls[0][0];
      expect(event.detail).toEqual({ theme: THEMES.DARK });
    });

    it('should dispatch theme-changed event with resolved system theme', () => {
      mockMediaQueryList.matches = true;
      applyTheme(THEMES.SYSTEM);
      const event = window.dispatchEvent.mock.calls[0][0];
      expect(event.detail).toEqual({ theme: THEMES.DARK });
    });
  });

  describe('initializeTheme', () => {
    it('should apply saved theme on initialization', () => {
      localStorage.setItem('app_theme', THEMES.DARK);
      initializeTheme();
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should apply default system theme when nothing saved', () => {
      initializeTheme();
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    it('should return cleanup function', () => {
      const cleanup = initializeTheme();
      expect(typeof cleanup).toBe('function');
    });

    it('should not set up listener when preference is not system', () => {
      localStorage.setItem('app_theme', THEMES.DARK);
      const cleanup = initializeTheme();
      // matchMedia should not be called when preference is not system
      expect(window.matchMedia).not.toHaveBeenCalled();
    });

    it('should return empty cleanup function when not system', () => {
      localStorage.setItem('app_theme', THEMES.DARK);
      const cleanup = initializeTheme();
      expect(cleanup()).toBeUndefined();
    });
  });

  describe('getThemeLabel', () => {
    it('should return correct label for light theme', () => {
      expect(getThemeLabel(THEMES.LIGHT)).toBe('Light');
    });

    it('should return correct label for dark theme', () => {
      expect(getThemeLabel(THEMES.DARK)).toBe('Dark');
    });

    it('should return correct label for system theme', () => {
      expect(getThemeLabel(THEMES.SYSTEM)).toBe('System');
    });

    it('should return original value for unknown theme', () => {
      expect(getThemeLabel('unknown')).toBe('unknown');
    });
  });
});

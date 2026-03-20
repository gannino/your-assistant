import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Vue composition API before import
jest.mock('vue', () => ({
  ref: jest.fn(value => ({ value })),
  onMounted: jest.fn(callback => callback()),
  onUnmounted: jest.fn(callback => callback()),
}));

import { useMobile } from '@/composables/useMobile';

describe('useMobile', () => {
  let originalInnerWidth;
  let mockResizeCallback;

  beforeEach(() => {
    // Store original window.innerWidth
    originalInnerWidth = window.innerWidth;
    mockResizeCallback = null;

    // Mock window.addEventListener to capture resize callback
    window.addEventListener = jest.fn((event, callback) => {
      if (event === 'resize') {
        mockResizeCallback = callback;
      }
    });

    // Mock window.removeEventListener
    window.removeEventListener = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  const setScreenWidth = width => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
  };

  describe('initialization and return values', () => {
    it('should return reactive refs and breakpoints', () => {
      setScreenWidth(1920);
      const result = useMobile();

      expect(result).toHaveProperty('isMobile');
      expect(result).toHaveProperty('isTablet');
      expect(result).toHaveProperty('isDesktop');
      expect(result).toHaveProperty('breakpoint');
      expect(result).toHaveProperty('tabletBreakpoint');
      expect(result.breakpoint).toBe(768);
      expect(result.tabletBreakpoint).toBe(1024);
    });

    it('should call checkDevice on mount', () => {
      setScreenWidth(375);
      const result = useMobile();

      // checkDevice should have been called during onMounted
      expect(result.isMobile.value).toBe(true);
    });
  });

  describe('screen size detection', () => {
    it('should detect mobile screen (< 768px)', () => {
      setScreenWidth(375);
      const result = useMobile();

      expect(result.isMobile.value).toBe(true);
      expect(result.isTablet.value).toBe(false);
      expect(result.isDesktop.value).toBe(false);
    });

    it('should detect tablet screen (768px - 1023px)', () => {
      setScreenWidth(800);
      const result = useMobile();

      expect(result.isMobile.value).toBe(false);
      expect(result.isTablet.value).toBe(true);
      expect(result.isDesktop.value).toBe(false);
    });

    it('should detect desktop screen (>= 1024px)', () => {
      setScreenWidth(1920);
      const result = useMobile();

      expect(result.isMobile.value).toBe(false);
      expect(result.isTablet.value).toBe(false);
      expect(result.isDesktop.value).toBe(true);
    });

    it('should detect mobile at boundary (767px)', () => {
      setScreenWidth(767);
      const result = useMobile();

      expect(result.isMobile.value).toBe(true);
      expect(result.isTablet.value).toBe(false);
    });

    it('should detect tablet at lower boundary (768px)', () => {
      setScreenWidth(768);
      const result = useMobile();

      expect(result.isMobile.value).toBe(false);
      expect(result.isTablet.value).toBe(true);
      expect(result.isDesktop.value).toBe(false);
    });

    it('should detect tablet at upper boundary (1023px)', () => {
      setScreenWidth(1023);
      const result = useMobile();

      expect(result.isTablet.value).toBe(true);
      expect(result.isDesktop.value).toBe(false);
    });

    it('should detect desktop at boundary (1024px)', () => {
      setScreenWidth(1024);
      const result = useMobile();

      expect(result.isMobile.value).toBe(false);
      expect(result.isTablet.value).toBe(false);
      expect(result.isDesktop.value).toBe(true);
    });

    it('should handle very small screen (320px)', () => {
      setScreenWidth(320);
      const result = useMobile();

      expect(result.isMobile.value).toBe(true);
    });

    it('should handle very large screen (7680px)', () => {
      setScreenWidth(7680);
      const result = useMobile();

      expect(result.isDesktop.value).toBe(true);
    });
  });

  describe('common device screen sizes', () => {
    it('should detect iPhone SE (375x667)', () => {
      setScreenWidth(375);
      const result = useMobile();
      expect(result.isMobile.value).toBe(true);
    });

    it('should detect iPhone 12 Pro (390x844)', () => {
      setScreenWidth(390);
      const result = useMobile();
      expect(result.isMobile.value).toBe(true);
    });

    it('should detect iPad Mini (768x1024)', () => {
      setScreenWidth(768);
      const result = useMobile();
      expect(result.isTablet.value).toBe(true);
    });

    it('should detect iPad Pro 11 (834x1194)', () => {
      setScreenWidth(834);
      const result = useMobile();
      expect(result.isTablet.value).toBe(true);
    });

    it('should detect MacBook Pro 13 (1280x800)', () => {
      setScreenWidth(1280);
      const result = useMobile();
      expect(result.isDesktop.value).toBe(true);
    });

    it('should detect Full HD (1920x1080)', () => {
      setScreenWidth(1920);
      const result = useMobile();
      expect(result.isDesktop.value).toBe(true);
    });

    it('should detect 4K (3840x2160)', () => {
      setScreenWidth(3840);
      const result = useMobile();
      expect(result.isDesktop.value).toBe(true);
    });
  });
});

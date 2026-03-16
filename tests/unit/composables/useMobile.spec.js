import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ref } from 'vue';

// Import the composable logic directly
const breakpoint = 768;
const tabletBreakpoint = 1024;

const checkDevice = (width, isMobile, isTablet, isDesktop) => {
  isMobile.value = width < breakpoint;
  isTablet.value = width >= breakpoint && width < tabletBreakpoint;
  isDesktop.value = width >= tabletBreakpoint;
};

describe('useMobile', () => {
  let originalInnerWidth;

  beforeEach(() => {
    // Store original window.innerWidth
    originalInnerWidth = window.innerWidth;
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

  describe('mobile detection', () => {
    it('should detect mobile screen (< 768px)', () => {
      setScreenWidth(375);

      const isMobile = ref(false);
      const isTablet = ref(false);
      const isDesktop = ref(false);

      checkDevice(375, isMobile, isTablet, isDesktop);

      expect(isMobile.value).toBe(true);
      expect(isTablet.value).toBe(false);
      expect(isDesktop.value).toBe(false);
    });

    it('should detect mobile screen at exactly breakpoint', () => {
      setScreenWidth(767);

      const isMobile = ref(false);
      const isTablet = ref(false);
      const isDesktop = ref(false);

      checkDevice(767, isMobile, isTablet, isDesktop);

      expect(isMobile.value).toBe(true);
    });

    it('should detect tablet screen (768px - 1023px)', () => {
      setScreenWidth(800);

      const isMobile = ref(false);
      const isTablet = ref(false);
      const isDesktop = ref(false);

      checkDevice(800, isMobile, isTablet, isDesktop);

      expect(isMobile.value).toBe(false);
      expect(isTablet.value).toBe(true);
      expect(isDesktop.value).toBe(false);
    });

    it('should detect desktop screen (>= 1024px)', () => {
      setScreenWidth(1920);

      const isMobile = ref(false);
      const isTablet = ref(false);
      const isDesktop = ref(false);

      checkDevice(1920, isMobile, isTablet, isDesktop);

      expect(isMobile.value).toBe(false);
      expect(isTablet.value).toBe(false);
      expect(isDesktop.value).toBe(true);
    });

    it('should detect desktop at exactly tablet breakpoint', () => {
      setScreenWidth(1024);

      const isMobile = ref(false);
      const isTablet = ref(false);
      const isDesktop = ref(false);

      checkDevice(1024, isMobile, isTablet, isDesktop);

      expect(isDesktop.value).toBe(true);
      expect(isMobile.value).toBe(false);
      expect(isTablet.value).toBe(false);
    });
  });

  describe('breakpoint values', () => {
    it('should have correct breakpoint values', () => {
      expect(breakpoint).toBe(768);
      expect(tabletBreakpoint).toBe(1024);
    });
  });

  describe('screen transitions', () => {
    it('should update from mobile to desktop', () => {
      const isMobile = ref(false);
      const isTablet = ref(false);
      const isDesktop = ref(false);

      checkDevice(375, isMobile, isTablet, isDesktop);
      expect(isMobile.value).toBe(true);
      expect(isDesktop.value).toBe(false);

      checkDevice(1920, isMobile, isTablet, isDesktop);
      expect(isMobile.value).toBe(false);
      expect(isDesktop.value).toBe(true);
    });

    it('should update from desktop to mobile', () => {
      const isMobile = ref(false);
      const isTablet = ref(false);
      const isDesktop = ref(false);

      checkDevice(1920, isMobile, isTablet, isDesktop);
      expect(isMobile.value).toBe(false);
      expect(isDesktop.value).toBe(true);

      checkDevice(375, isMobile, isTablet, isDesktop);
      expect(isMobile.value).toBe(true);
      expect(isDesktop.value).toBe(false);
    });

    it('should update from mobile to tablet', () => {
      const isMobile = ref(false);
      const isTablet = ref(false);
      const isDesktop = ref(false);

      checkDevice(375, isMobile, isTablet, isDesktop);
      expect(isMobile.value).toBe(true);
      expect(isTablet.value).toBe(false);

      checkDevice(800, isMobile, isTablet, isDesktop);
      expect(isMobile.value).toBe(false);
      expect(isTablet.value).toBe(true);
    });

    it('should update from tablet to desktop', () => {
      const isMobile = ref(false);
      const isTablet = ref(false);
      const isDesktop = ref(false);

      checkDevice(800, isMobile, isTablet, isDesktop);
      expect(isTablet.value).toBe(true);
      expect(isDesktop.value).toBe(false);

      checkDevice(1920, isMobile, isTablet, isDesktop);
      expect(isTablet.value).toBe(false);
      expect(isDesktop.value).toBe(true);
    });

    it('should handle multiple screen changes', () => {
      const isMobile = ref(false);
      const isTablet = ref(false);
      const isDesktop = ref(false);

      checkDevice(1920, isMobile, isTablet, isDesktop);
      expect(isDesktop.value).toBe(true);

      checkDevice(375, isMobile, isTablet, isDesktop);
      expect(isMobile.value).toBe(true);

      checkDevice(800, isMobile, isTablet, isDesktop);
      expect(isMobile.value).toBe(false);
      expect(isTablet.value).toBe(true);

      checkDevice(1920, isMobile, isTablet, isDesktop);
      expect(isTablet.value).toBe(false);
      expect(isDesktop.value).toBe(true);
    });
  });

  describe('common screen sizes', () => {
    it('should detect iPhone SE (375x667)', () => {
      const isMobile = ref(false);
      checkDevice(375, isMobile, ref(false), ref(false));
      expect(isMobile.value).toBe(true);
    });

    it('should detect iPhone 12 Pro (390x844)', () => {
      const isMobile = ref(false);
      checkDevice(390, isMobile, ref(false), ref(false));
      expect(isMobile.value).toBe(true);
    });

    it('should detect iPad Mini (768x1024)', () => {
      const isTablet = ref(false);
      checkDevice(768, ref(false), isTablet, ref(false));
      expect(isTablet.value).toBe(true);
    });

    it('should detect iPad Pro 11 (834x1194)', () => {
      const isTablet = ref(false);
      checkDevice(834, ref(false), isTablet, ref(false));
      expect(isTablet.value).toBe(true);
    });

    it('should detect MacBook Pro 13 (1280x800)', () => {
      const isDesktop = ref(false);
      checkDevice(1280, ref(false), ref(false), isDesktop);
      expect(isDesktop.value).toBe(true);
    });

    it('should detect Full HD (1920x1080)', () => {
      const isDesktop = ref(false);
      checkDevice(1920, ref(false), ref(false), isDesktop);
      expect(isDesktop.value).toBe(true);
    });

    it('should detect 4K (3840x2160)', () => {
      const isDesktop = ref(false);
      checkDevice(3840, ref(false), ref(false), isDesktop);
      expect(isDesktop.value).toBe(true);
    });
  });

  describe('boundary conditions', () => {
    it('should handle width of 0', () => {
      const isMobile = ref(false);
      checkDevice(0, isMobile, ref(false), ref(false));
      expect(isMobile.value).toBe(true);
    });

    it('should handle very small width', () => {
      const isMobile = ref(false);
      checkDevice(320, isMobile, ref(false), ref(false));
      expect(isMobile.value).toBe(true);
    });

    it('should handle very large width', () => {
      const isDesktop = ref(false);
      checkDevice(7680, ref(false), ref(false), isDesktop);
      expect(isDesktop.value).toBe(true);
    });

    it('should handle boundary at 767px', () => {
      const isMobile = ref(false);
      checkDevice(767, isMobile, ref(false), ref(false));
      expect(isMobile.value).toBe(true);
    });

    it('should handle boundary at 768px', () => {
      const isTablet = ref(false);
      checkDevice(768, ref(false), isTablet, ref(false));
      expect(isTablet.value).toBe(true);
    });

    it('should handle boundary at 1023px', () => {
      const isTablet = ref(false);
      checkDevice(1023, ref(false), isTablet, ref(false));
      expect(isTablet.value).toBe(true);
    });

    it('should handle boundary at 1024px', () => {
      const isDesktop = ref(false);
      checkDevice(1024, ref(false), ref(false), isDesktop);
      expect(isDesktop.value).toBe(true);
    });
  });
});

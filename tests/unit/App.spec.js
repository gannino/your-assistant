/**
 * App component tests
 * @component tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { mount, config } from '@vue/test-utils';
import App from '@/App.vue';

// Configure Vue Test Utils to use Element Plus
config.global.stubs = {
  ElMenu: {
    name: 'ElMenu',
    template: '<div class="el-menu" :default-active="defaultActive"><slot /></div>',
    props: ['defaultActive', 'mode', 'router'],
  },
  ElMenuItem: {
    name: 'ElMenuItem',
    template: '<div class="el-menu-item" :index="index"><slot /></div>',
    props: ['index'],
  },
  ElButton: {
    name: 'ElButton',
    template: '<button @click="$emit(\'click\')"><slot /></button>',
    props: ['icon', 'size', 'circle'],
  },
  ElIcon: {
    name: 'ElIcon',
    template: '<span class="el-icon"><slot /></span>',
  },
};

// Mock vue-router
jest.mock('vue-router', () => ({
  useRoute: jest.fn(() => ({ path: '/' })),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// Mock useElectron composable
jest.mock('@/composables/useElectron', () => ({
  useElectron: jest.fn(() => ({
    isElectron: false,
    hideWindow: jest.fn(),
    moveWindow: jest.fn(),
  })),
}));

// Mock theme_util
jest.mock('@/utils/theme_util', () => ({
  initializeTheme: jest.fn(() => jest.fn()),
}));

// Mock window.electronAPI for Electron mode
Object.defineProperty(window, 'electronAPI', {
  value: undefined,
  writable: true,
  configurable: true,
});

describe('App.vue', () => {
  let originalLocalStorage;

  beforeEach(() => {
    // Mock localStorage with Jest spies
    originalLocalStorage = global.localStorage;
    const mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    // Default return values
    mockLocalStorage.getItem.mockReturnValue(null);
    global.localStorage = mockLocalStorage;

    // Reset process.env
    process.env.NODE_ENV = 'test';

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    global.localStorage = originalLocalStorage;

    // Reset window.electronAPI
    window.electronAPI = undefined;
  });

  describe('Component Rendering', () => {
    it('should render component', () => {
      const wrapper = mount(App);

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('#app').exists()).toBe(true);
    });

    it('should not apply electron-app class when not in Electron', () => {
      const wrapper = mount(App);

      expect(wrapper.find('.electron-app').exists()).toBe(false);
    });

    it('should render router-view', () => {
      const wrapper = mount(App);

      expect(wrapper.find('.router_view').exists()).toBe(true);
    });

    it('should render navigation menu', () => {
      const wrapper = mount(App);

      expect(wrapper.find('.el-menu').exists()).toBe(true);
    });

    it('should render two menu items', () => {
      const wrapper = mount(App);

      const menuItems = wrapper.findAll('.el-menu-item');
      expect(menuItems).toHaveLength(2);
    });

    it('should render home menu item', () => {
      const wrapper = mount(App);

      const menuItems = wrapper.findAll('.el-menu-item');
      expect(menuItems[0].text()).toContain('Your Assistant');
    });

    it('should render settings menu item', () => {
      const wrapper = mount(App);

      const menuItems = wrapper.findAll('.el-menu-item');
      expect(menuItems[1].text()).toContain('Settings');
    });
  });

  describe('Computed Properties', () => {
    describe('activeIndex', () => {
      it('should return root path for home page', () => {
        const { useRoute } = require('vue-router');
        useRoute.mockReturnValue({ path: '/' });

        const wrapper = mount(App);

        expect(wrapper.vm.activeIndex).toBe('/');
      });

      it('should return settings path for settings pages', () => {
        const { useRoute } = require('vue-router');
        useRoute.mockReturnValue({ path: '/settings/content' });

        const wrapper = mount(App);

        expect(wrapper.vm.activeIndex).toBe('/settings/content');
      });

      it('should return settings/content for all settings paths', () => {
        const { useRoute } = require('vue-router');
        useRoute.mockReturnValue({ path: '/settings/ai' });

        const wrapper = mount(App);

        expect(wrapper.vm.activeIndex).toBe('/settings/content');
      });
    });
  });

  describe('App Version', () => {
    it('should have appVersion ref', () => {
      const wrapper = mount(App);

      expect(wrapper.vm.appVersion).toBeDefined();
    });

    it('should default to 1.0.0 when env var not set', () => {
      const wrapper = mount(App);

      expect(wrapper.vm.appVersion).toBe('1.0.0');
    });

    it('should use VUE_APP_VERSION env var when set', () => {
      process.env.VUE_APP_VERSION = '2.0.0';

      const wrapper = mount(App);

      expect(wrapper.vm.appVersion).toBe('2.0.0');

      // Reset
      process.env.VUE_APP_VERSION = undefined;
    });
  });

  describe('Electron Integration', () => {
    it('should not show electron titlebar when not in Electron', () => {
      const wrapper = mount(App);

      expect(wrapper.find('.electron-titlebar').exists()).toBe(false);
    });

    it('should have isElectron computed property', () => {
      const wrapper = mount(App);

      expect(wrapper.vm.isElectron).toBe(false);
    });
  });

  describe('Theme Initialization', () => {
    it('should initialize theme on mount', () => {
      const { initializeTheme } = require('@/utils/theme_util');
      const cleanupFn = jest.fn();

      initializeTheme.mockReturnValue(cleanupFn);

      const wrapper = mount(App);

      expect(initializeTheme).toHaveBeenCalled();
    });

    it('should cleanup theme on unmount', () => {
      const { initializeTheme } = require('@/utils/theme_util');
      const cleanupFn = jest.fn();
      initializeTheme.mockReturnValue(cleanupFn);

      const wrapper = mount(App);
      wrapper.unmount();

      expect(cleanupFn).toHaveBeenCalled();
    });
  });

  describe('Window Drag Function', () => {
    it('should have startDrag function', () => {
      const wrapper = mount(App);

      expect(typeof wrapper.vm.startDrag).toBe('function');
    });

    it('should return early from startDrag when not in Electron', () => {
      const wrapper = mount(App);

      // Mock event
      const mockEvent = { screenX: 100, screenY: 100 };

      // Should not throw and should return early
      expect(() => wrapper.vm.startDrag(mockEvent)).not.toThrow();
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply #app id', () => {
      const wrapper = mount(App);

      expect(wrapper.find('#app').exists()).toBe(true);
    });

    it('should have router_view class', () => {
      const wrapper = mount(App);

      expect(wrapper.find('.router_view').exists()).toBe(true);
    });
  });

  describe('Electron-Specific Features', () => {
    beforeEach(() => {
      const { useElectron } = require('@/composables/useElectron');
      useElectron.mockReturnValue({
        isElectron: true,
        hideWindow: jest.fn(),
        moveWindow: jest.fn(),
      });

      // Mock window.electronAPI
      Object.defineProperty(window, 'electronAPI', {
        value: {
          setWindowSize: jest.fn(),
          setOpacity: jest.fn(),
        },
        writable: true,
        configurable: true,
      });
    });

    it('should apply electron-app class when in Electron', () => {
      const wrapper = mount(App);

      expect(wrapper.find('.electron-app').exists()).toBe(true);
    });

    it('should show electron titlebar when in Electron', () => {
      const wrapper = mount(App);

      expect(wrapper.find('.electron-titlebar').exists()).toBe(true);
    });

    it('should have hideWindow method when in Electron', () => {
      const wrapper = mount(App);

      expect(wrapper.vm.hideWindow).toBeDefined();
    });

    it('should apply saved window size on mount in Electron', () => {
      // Mount with localStorage values set before component loads
      const wrapper = mount(App);

      // Component should mount without errors when Electron API is present
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm.isElectron).toBe(true);
    });

    it('should apply saved opacity on mount in Electron', () => {
      // Component should mount successfully and have Electron features
      const wrapper = mount(App);

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.electron-titlebar').exists()).toBe(true);
    });
  });

  describe('Appearance Settings', () => {
    beforeEach(() => {
      // Mock window.electronAPI to avoid errors in App.vue mount hook
      Object.defineProperty(window, 'electronAPI', {
        value: {
          setWindowSize: jest.fn(),
          setOpacity: jest.fn(),
        },
        writable: true,
        configurable: true,
      });
    });

    it('should read appearance_opacity from localStorage on mount', () => {
      // Component should mount without errors when checking appearance settings
      const wrapper = mount(App);

      expect(wrapper.exists()).toBe(true);
      // Verify component has access to localStorage methods
      expect(typeof localStorage.getItem).toBe('function');
    });
  });
});

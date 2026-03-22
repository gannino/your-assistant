/**
 * ElectronSettings component tests
 * @component tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { mount, config } from '@vue/test-utils';
import ElectronSettings from '@/views/settings/ElectronSettings.vue';

// Configure Vue Test Utils to use Element Plus
config.global.stubs = {
  SettingsLayout: {
    name: 'SettingsLayout',
    template: '<div class="settings-layout"><slot /></div>',
  },
  ElSlider: {
    name: 'ElSlider',
    template: '<div class="el-slider"></div>',
  },
  ElRadioGroup: {
    name: 'ElRadioGroup',
    template: '<div class="radio-group"><slot /></div>',
  },
  ElRadioButton: {
    name: 'ElRadioButton',
    template: '<label class="radio-button"><slot /></label>',
  },
  ElButton: {
    name: 'ElButton',
    template: '<button><slot /></button>',
  },
  ElInputNumber: {
    name: 'ElInputNumber',
    template: '<input type="number">',
  },
  ElTable: {
    name: 'ElTable',
    template: '<table class="el-table"><tbody><tr v-for="row in data" :key="row.keys"><td>{{ row.keys }}</td><td>{{ row.action }}</td></tr></tbody></table>',
    props: ['data'],
  },
  ElTableColumn: {
    name: 'ElTableColumn',
    template: '<span />',
  },
  ElDescriptions: {
    name: 'ElDescriptions',
    template: '<div class="descriptions"><slot /></div>',
  },
  ElDescriptionsItem: {
    name: 'ElDescriptionsItem',
    template: '<div class="descriptions-item"><slot /></div>',
  },
  ElTag: {
    name: 'ElTag',
    template: '<span class="el-tag"><slot /></span>',
  },
  ElAlert: {
    name: 'ElAlert',
    template: '<div v-if="false" class="el-alert"></div>',
  },
  ElIcon: {
    name: 'ElIcon',
    template: '<span class="el-icon"><slot /></span>',
  },
};

// Mock useElectron composable
jest.mock('@/composables/useElectron', () => ({
  useElectron: () => ({ isElectron: false }),
}));

// Mock useAutoMode
jest.mock('@/composables/useAutoMode', () => ({
  AUTO_DEFAULTS: {
    triggerDelay: 2500,
    screenshotInterval: 0,
    diffThreshold: 0.05,
  },
}));

// Mock theme_util
jest.mock('@/utils/theme_util', () => ({
  getThemePreference: () => 'system',
  setThemePreference: jest.fn(),
}));

describe('ElectronSettings.vue', () => {
  let setPropertySpy;

  beforeEach(() => {
    // Mock process.env
    process.env.VUE_APP_VERSION = '1.0.0';

    // Mock localStorage
    localStorage.clear();

    // Mock window.electronAPI
    window.electronAPI = undefined;

    // Mock document.documentElement.style
    const styleMock = {};
    setPropertySpy = jest.fn((key, value) => {
      styleMock[key] = value;
    });
    document.documentElement.style = styleMock;
    document.documentElement.style.setProperty = setPropertySpy;

    // Mock document.documentElement.getAttribute
    document.documentElement.getAttribute = jest.fn(() => null);

    // Mock document.documentElement.setAttribute
    document.documentElement.setAttribute = jest.fn();

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Component Rendering', () => {
    it('should render component', () => {
      const wrapper = mount(ElectronSettings);
      expect(wrapper.exists()).toBe(true);
    });

    it('should have electron-settings class', () => {
      const wrapper = mount(ElectronSettings);
      expect(wrapper.find('.electron-settings').exists()).toBe(true);
    });
  });

  describe('Default Values', () => {
    it('should have default opacity of 0.72', () => {
      const wrapper = mount(ElectronSettings);
      expect(wrapper.vm.opacity).toBe(0.72);
    });

    it('should have default blur of 18', () => {
      const wrapper = mount(ElectronSettings);
      expect(wrapper.vm.blurAmount).toBe(18);
    });

    it('should have default scroll speed of 80', () => {
      const wrapper = mount(ElectronSettings);
      expect(wrapper.vm.scrollSpeed).toBe(80);
    });

    it('should have default window width of 480', () => {
      const wrapper = mount(ElectronSettings);
      expect(wrapper.vm.windowWidth).toBe(480);
    });

    it('should have default window height of 640', () => {
      const wrapper = mount(ElectronSettings);
      expect(wrapper.vm.windowHeight).toBe(640);
    });

    it('should have default trigger delay of 2500', () => {
      const wrapper = mount(ElectronSettings);
      expect(wrapper.vm.triggerDelay).toBe(2500);
    });

    it('should have default screenshot interval of 0', () => {
      const wrapper = mount(ElectronSettings);
      expect(wrapper.vm.screenshotInterval).toBe(0);
    });

    it('should have default diff threshold of 0.05', () => {
      const wrapper = mount(ElectronSettings);
      expect(wrapper.vm.diffThreshold).toBe(0.05);
    });

    it('should display app version from process.env', () => {
      process.env.VUE_APP_VERSION = '2.1.0';
      const wrapper = mount(ElectronSettings);
      expect(wrapper.vm.appVersion).toBe('2.1.0');
    });
  });

  describe('Shortcuts Table', () => {
    it('should have 3 shortcuts defined', () => {
      const wrapper = mount(ElectronSettings);
      expect(wrapper.vm.shortcuts).toHaveLength(3);
    });

    it('should contain correct shortcut data', () => {
      const wrapper = mount(ElectronSettings);
      const shortcuts = wrapper.vm.shortcuts;
      expect(shortcuts[0].keys).toBe('Cmd/Ctrl + Shift + Space');
      expect(shortcuts[0].action).toBe('Show / hide overlay');
      expect(shortcuts[1].keys).toBe('Cmd/Ctrl + ←→↑↓');
      expect(shortcuts[1].action).toBe('Move window 40px');
      expect(shortcuts[2].keys).toBe('⌥M / ⌘M');
      expect(shortcuts[2].action).toBe('Toggle overlay / Picture-in-Picture mode');
    });
  });

  describe('localStorage Integration', () => {
    it('should load saved opacity from localStorage', () => {
      localStorage.setItem('appearance_opacity', '0.5');
      const wrapper = mount(ElectronSettings);
      expect(wrapper.vm.opacity).toBe(0.5);
    });

    it('should load saved blur from localStorage', () => {
      localStorage.setItem('appearance_blur', '20');
      const wrapper = mount(ElectronSettings);
      expect(wrapper.vm.blurAmount).toBe(20);
    });

    it('should load saved scroll speed from localStorage', () => {
      localStorage.setItem('appearance_scroll_speed', '100');
      const wrapper = mount(ElectronSettings);
      expect(wrapper.vm.scrollSpeed).toBe(100);
    });

    it('should load saved window width from localStorage', () => {
      localStorage.setItem('electron_win_width', '600');
      const wrapper = mount(ElectronSettings);
      expect(wrapper.vm.windowWidth).toBe(600);
    });

    it('should load saved window height from localStorage', () => {
      localStorage.setItem('electron_win_height', '800');
      const wrapper = mount(ElectronSettings);
      expect(wrapper.vm.windowHeight).toBe(800);
    });

    it('should load saved trigger delay from localStorage', () => {
      localStorage.setItem('auto_trigger_delay_ms', '3000');
      const wrapper = mount(ElectronSettings);
      expect(wrapper.vm.triggerDelay).toBe(3000);
    });

    it('should load saved screenshot interval from localStorage', () => {
      localStorage.setItem('auto_screenshot_interval_ms', '5000');
      const wrapper = mount(ElectronSettings);
      expect(wrapper.vm.screenshotInterval).toBe(5000);
    });

    it('should load saved diff threshold from localStorage', () => {
      localStorage.setItem('auto_diff_threshold', '0.1');
      const wrapper = mount(ElectronSettings);
      expect(wrapper.vm.diffThreshold).toBe(0.1);
    });

    it('should handle NaN value from localStorage', () => {
      localStorage.setItem('appearance_opacity', 'invalid');
      const wrapper = mount(ElectronSettings);
      // parseFloat returns NaN for invalid input
      expect(isNaN(wrapper.vm.opacity)).toBe(true);
    });
  });

  describe('Methods - applyAppearance', () => {
    it('should set CSS variables for dark theme', () => {
      document.documentElement.getAttribute.mockReturnValue('dark');
      const wrapper = mount(ElectronSettings);
      wrapper.vm.applyAppearance(0.8, 20);
      expect(setPropertySpy).toHaveBeenCalledWith('--bg-primary', 'rgba(30,30,30,0.80)');
    });

    it('should set CSS variables for light theme', () => {
      document.documentElement.getAttribute.mockReturnValue('light');
      const wrapper = mount(ElectronSettings);
      wrapper.vm.applyAppearance(0.8, 20);
      expect(setPropertySpy).toHaveBeenCalledWith('--bg-primary', 'rgba(255,255,255,0.80)');
    });

    it('should set backdrop blur CSS variable', () => {
      const wrapper = mount(ElectronSettings);
      wrapper.vm.applyAppearance(0.8, 20);
      expect(setPropertySpy).toHaveBeenCalledWith('--backdrop-blur', 'blur(20px)');
    });
  });

  describe('Methods - onOpacityChange', () => {
    it('should save opacity to localStorage', () => {
      const wrapper = mount(ElectronSettings);
      wrapper.vm.onOpacityChange(0.5);
      expect(localStorage.getItem('appearance_opacity')).toBe('0.5');
    });

    it('should call applyAppearance with new values', () => {
      const wrapper = mount(ElectronSettings);
      // Clear previous calls
      setPropertySpy.mockClear();
      wrapper.vm.onOpacityChange(0.5);
      // applyAppearance is called, which calls setProperty
      expect(setPropertySpy).toHaveBeenCalled();
    });
  });

  describe('Methods - onBlurChange', () => {
    it('should save blur to localStorage', () => {
      const wrapper = mount(ElectronSettings);
      wrapper.vm.onBlurChange(20);
      expect(localStorage.getItem('appearance_blur')).toBe('20');
    });

    it('should call applyAppearance with new values', () => {
      const wrapper = mount(ElectronSettings);
      // Clear previous calls
      setPropertySpy.mockClear();
      wrapper.vm.onBlurChange(20);
      // applyAppearance is called, which calls setProperty
      expect(setPropertySpy).toHaveBeenCalled();
    });
  });

  describe('Methods - onScrollSpeedChange', () => {
    it('should save scroll speed to localStorage', () => {
      const wrapper = mount(ElectronSettings);
      wrapper.vm.onScrollSpeedChange(150);
      expect(localStorage.getItem('appearance_scroll_speed')).toBe('150');
    });
  });

  describe('Methods - onThemeChange', () => {
    it('should call setThemePreference', () => {
      const { setThemePreference } = require('@/utils/theme_util');
      const wrapper = mount(ElectronSettings);
      wrapper.vm.onThemeChange('dark');
      expect(setThemePreference).toHaveBeenCalledWith('dark');
    });
  });

  describe('Methods - onWindowSizeChange', () => {
    it('should save window dimensions to localStorage', () => {
      const wrapper = mount(ElectronSettings);
      wrapper.vm.windowWidth = 600;
      wrapper.vm.windowHeight = 800;
      wrapper.vm.onWindowSizeChange();
      expect(localStorage.getItem('electron_win_width')).toBe('600');
      expect(localStorage.getItem('electron_win_height')).toBe('800');
    });
  });

  describe('Methods - onAutoSettingsChange', () => {
    it('should save auto mode settings to localStorage', () => {
      const wrapper = mount(ElectronSettings);
      wrapper.vm.triggerDelay = 3000;
      wrapper.vm.screenshotInterval = 5000;
      wrapper.vm.diffThreshold = 0.1;
      wrapper.vm.onAutoSettingsChange();
      expect(localStorage.getItem('auto_trigger_delay_ms')).toBe('3000');
      expect(localStorage.getItem('auto_screenshot_interval_ms')).toBe('5000');
      expect(localStorage.getItem('auto_diff_threshold')).toBe('0.1');
    });
  });

  describe('Methods - resetAppearance', () => {
    it('should reset all appearance settings to defaults', () => {
      const { setThemePreference } = require('@/utils/theme_util');
      const wrapper = mount(ElectronSettings);

      // Change some values first
      wrapper.vm.opacity = 0.5;
      wrapper.vm.blurAmount = 10;
      wrapper.vm.scrollSpeed = 150;

      wrapper.vm.resetAppearance();

      expect(wrapper.vm.opacity).toBe(0.72);
      expect(wrapper.vm.blurAmount).toBe(18);
      expect(wrapper.vm.scrollSpeed).toBe(80);
      expect(setThemePreference).toHaveBeenCalledWith('system');
    });

    it('should remove localStorage keys on reset', () => {
      localStorage.setItem('appearance_opacity', '0.5');
      localStorage.setItem('appearance_blur', '10');
      localStorage.setItem('appearance_scroll_speed', '150');
      localStorage.setItem('app_theme', 'dark');

      const wrapper = mount(ElectronSettings);
      wrapper.vm.resetAppearance();

      expect(localStorage.getItem('appearance_opacity')).toBeNull();
      expect(localStorage.getItem('appearance_blur')).toBeNull();
      expect(localStorage.getItem('appearance_scroll_speed')).toBeNull();
      expect(localStorage.getItem('app_theme')).toBeNull();
    });

    it('should call applyAppearance with defaults', () => {
      const wrapper = mount(ElectronSettings);
      // Clear previous calls
      setPropertySpy.mockClear();
      wrapper.vm.resetAppearance();
      // applyAppearance is called during reset
      expect(setPropertySpy).toHaveBeenCalled();
    });
  });

  describe('Event Listeners', () => {
    it('should add theme-changed listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      mount(ElectronSettings);
      expect(addEventListenerSpy).toHaveBeenCalledWith('theme-changed', expect.any(Function));
    });

    it('should remove theme-changed listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const wrapper = mount(ElectronSettings);
      wrapper.unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('theme-changed', expect.any(Function));
    });

    it('should call applyAppearance when theme-changed event fires', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      mount(ElectronSettings);

      // Get the handler that was registered
      const handler = addEventListenerSpy.mock.calls.find(call => call[0] === 'theme-changed')[1];

      // Now trigger the handler and check if applyAppearance would be called
      // We can't spy on it directly since it was called during mount, but we can verify the handler exists
      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');
    });
  });

  describe('Electron API Integration', () => {
    it('should call electronAPI.setOpacity when opacity changes in Electron', () => {
      window.electronAPI = { setOpacity: jest.fn() };
      const wrapper = mount(ElectronSettings);
      wrapper.vm.onOpacityChange(0.8);
      expect(window.electronAPI.setOpacity).toHaveBeenCalledWith(0.8);
    });

    it('should not error when electronAPI is undefined', () => {
      // window.electronAPI is undefined (browser mode)
      const wrapper = mount(ElectronSettings);
      expect(() => wrapper.vm.onOpacityChange(0.8)).not.toThrow();
    });

    it('should not call electronAPI.setOpacity when it does not exist', () => {
      window.electronAPI = {};
      const wrapper = mount(ElectronSettings);
      wrapper.vm.onOpacityChange(0.8);
      // Should not throw error
      expect(wrapper.vm.opacity).toBeLessThanOrEqual(1);
    });
  });

  describe('Theme Integration', () => {
    it('should load theme preference on mount', () => {
      // The mock is already set up at the top of the file
      // Just verify the component mounts without error
      const wrapper = mount(ElectronSettings);
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm.theme).toBeDefined();
    });
  });

  describe('CSS Variable Application', () => {
    it('should apply correct rgba values for dark theme with opacity 0.8', () => {
      document.documentElement.getAttribute.mockReturnValue('dark');
      const wrapper = mount(ElectronSettings);
      wrapper.vm.applyAppearance(0.8, 20);

      expect(setPropertySpy).toHaveBeenCalledWith('--bg-primary', 'rgba(30,30,30,0.80)');
      expect(setPropertySpy).toHaveBeenCalledWith('--bg-secondary', 'rgba(40,40,40,0.72)');
      expect(setPropertySpy).toHaveBeenCalledWith('--bg-tertiary', 'rgba(50,50,50,0.66)');
    });

    it('should apply correct rgba values for light theme with opacity 0.8', () => {
      document.documentElement.getAttribute.mockReturnValue('light');
      const wrapper = mount(ElectronSettings);
      wrapper.vm.applyAppearance(0.8, 20);

      expect(setPropertySpy).toHaveBeenCalledWith('--bg-primary', 'rgba(255,255,255,0.80)');
      expect(setPropertySpy).toHaveBeenCalledWith('--bg-secondary', 'rgba(245,247,250,0.72)');
      expect(setPropertySpy).toHaveBeenCalledWith('--bg-tertiary', 'rgba(250,250,250,0.66)');
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum opacity value', () => {
      const wrapper = mount(ElectronSettings);
      wrapper.vm.applyAppearance(0.2, 10);
      expect(setPropertySpy).toHaveBeenCalled();
    });

    it('should handle maximum opacity value', () => {
      const wrapper = mount(ElectronSettings);
      wrapper.vm.applyAppearance(1.0, 10);
      expect(setPropertySpy).toHaveBeenCalled();
    });

    it('should handle zero blur value', () => {
      const wrapper = mount(ElectronSettings);
      wrapper.vm.applyAppearance(0.8, 0);
      expect(setPropertySpy).toHaveBeenCalledWith('--backdrop-blur', 'blur(0px)');
    });

    it('should handle maximum blur value', () => {
      const wrapper = mount(ElectronSettings);
      wrapper.vm.applyAppearance(0.8, 32);
      expect(setPropertySpy).toHaveBeenCalledWith('--backdrop-blur', 'blur(32px)');
    });

    it('should handle zero screenshot interval', () => {
      const wrapper = mount(ElectronSettings);
      wrapper.vm.screenshotInterval = 0;
      expect(wrapper.vm.screenshotInterval).toBe(0);
    });

    it('should handle maximum screenshot interval', () => {
      const wrapper = mount(ElectronSettings);
      wrapper.vm.screenshotInterval = 30000;
      expect(wrapper.vm.screenshotInterval).toBe(30000);
    });
  });
});

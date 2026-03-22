/**
 * SettingsLayout component tests
 * @component tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { mount, config } from '@vue/test-utils';
import SettingsLayout from '@/views/settings/SettingsLayout.vue';

// Configure Vue Test Utils to use Element Plus
config.global.stubs = {
  ElMenu: {
    name: 'ElMenu',
    template: '<div class="el-menu" :data-default-active="defaultActive"><slot /></div>',
    props: ['defaultActive', 'mode'],
  },
  ElMenuItem: {
    name: 'ElMenuItem',
    template: '<div class="el-menu-item" :index="index" @click="$emit(\'click\')"><slot /></div>',
    props: ['index'],
  },
  ElIcon: {
    name: 'ElIcon',
    template: '<span class="el-icon"><slot /></span>',
  },
};

// Mock vue-router
const mockPush = jest.fn();
jest.mock('vue-router', () => ({
  useRoute: () => ({ path: '/settings/content' }),
  useRouter: () => ({ push: mockPush }),
}));

describe('SettingsLayout.vue', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockPush.mockClear();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render component', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.settings-layout').exists()).toBe(true);
    });

    it('should render header with title', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      expect(wrapper.find('h1').text()).toBe('Settings');
    });

    it('should render subtitle', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      expect(wrapper.find('.settings-subtitle').text()).toBe(
        'Configure Your Assistant providers and content'
      );
    });

    it('should render navigation menu', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      expect(wrapper.find('.settings-nav').exists()).toBe(true);
      expect(wrapper.find('.el-menu').exists()).toBe(true);
    });

    it('should render settings content area', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      expect(wrapper.find('.settings-content').exists()).toBe(true);
    });
  });

  describe('Navigation Menu Items', () => {
    it('should render 4 navigation menu items', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      const menuItems = wrapper.findAll('.el-menu-item');
      expect(menuItems).toHaveLength(4);
    });

    it('should render Content menu item', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      const menuItems = wrapper.findAll('.el-menu-item');
      expect(menuItems[0].text()).toContain('Content');
    });

    it('should render Speech menu item', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      const menuItems = wrapper.findAll('.el-menu-item');
      expect(menuItems[1].text()).toContain('Speech');
    });

    it('should render AI menu item', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      },

      );

      const menuItems = wrapper.findAll('.el-menu-item');
      expect(menuItems[2].text()).toContain('AI');
    });

    it('should render Overlay menu item', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      const menuItems = wrapper.findAll('.el-menu-item');
      expect(menuItems[3].text()).toContain('Overlay');
    });

    it('should render icons for each menu item', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      const icons = wrapper.findAll('.el-icon');
      expect(icons).toHaveLength(4);
    });
  });

  describe('Navigation', () => {
    it('should navigate to content settings when clicking Content menu item', async () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      const menuItems = wrapper.findAll('.el-menu-item');
      await menuItems[0].trigger('click');

      expect(mockPush).toHaveBeenCalledWith('/settings/content');
    });

    it('should navigate to speech settings when clicking Speech menu item', async () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      const menuItems = wrapper.findAll('.el-menu-item');
      await menuItems[1].trigger('click');

      expect(mockPush).toHaveBeenCalledWith('/settings/speech');
    });

    it('should navigate to AI settings when clicking AI menu item', async () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      const menuItems = wrapper.findAll('.el-menu-item');
      await menuItems[2].trigger('click');

      expect(mockPush).toHaveBeenCalledWith('/settings/ai');
    });

    it('should navigate to overlay settings when clicking Overlay menu item', async () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      const menuItems = wrapper.findAll('.el-menu-item');
      await menuItems[3].trigger('click');

      expect(mockPush).toHaveBeenCalledWith('/settings/electron');
    });
  });

  describe('Active Route Highlighting', () => {
    it('should pass active route to menu default-active prop', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      const menu = wrapper.find('.el-menu');
      expect(menu.attributes('data-default-active')).toBe('/settings/content');
    });
  });

  describe('Slot Content', () => {
    it('should render content in slot', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
        slots: {
          default: '<div class="test-slot-content">Test Content</div>',
        },
      });

      expect(wrapper.find('.test-slot-content').exists()).toBe(true);
      expect(wrapper.find('.test-slot-content').text()).toBe('Test Content');
    });

    it('should render slot content in settings-content area', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
        slots: {
          default: '<div class="slot-test">Slot Content</div>',
        },
      });

      const contentArea = wrapper.find('.settings-content');
      expect(contentArea.find('.slot-test').exists()).toBe(true);
    });
  });

  describe('Computed Properties', () => {
    it('should compute activeRoute from route path', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      expect(wrapper.vm.activeRoute).toBe('/settings/content');
    });
  });

  describe('Methods', () => {
    it('should call router.push when navigateTo is called', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      wrapper.vm.navigateTo('/settings/test');

      expect(mockPush).toHaveBeenCalledWith('/settings/test');
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply settings-layout class', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      expect(wrapper.find('.settings-layout').exists()).toBe(true);
    });

    it('should apply settings-header class', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      expect(wrapper.find('.settings-header').exists()).toBe(true);
    });

    it('should apply settings-nav class to navigation', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      expect(wrapper.find('.settings-nav').exists()).toBe(true);
    });

    it('should apply settings-content class to content area', () => {
      const wrapper = mount(SettingsLayout, {
        global: {
          stubs: {
            routerLink: true,
          },
        },
      });

      expect(wrapper.find('.settings-content').exists()).toBe(true);
    });
  });
});

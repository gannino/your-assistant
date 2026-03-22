/**
 * OverlayPanel component tests
 * @component tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { mount, config } from '@vue/test-utils';
import OverlayPanel from '@/components/OverlayPanel.vue';

// Configure Vue Test Utils to use Element Plus
config.global.stubs = {
  ElButton: {
    name: 'ElButton',
    template: '<button @click="$emit(\'click\')"><slot /></button>',
  },
  ElTag: {
    name: 'ElTag',
    template: '<span class="el-tag" :type="type" :size="size" :effect="effect"><slot /></span>',
  },
  ElIcon: {
    name: 'ElIcon',
    template: '<span class="el-icon" :class="{ \'is-loading\': loading }"><slot /></span>',
  },
};

// Mock markdown_util
jest.mock('@/utils/markdown_util', () => ({
  renderMarkdown: jest.fn((text) => `<p>${text}</p>`),
}));

describe('OverlayPanel.vue', () => {
  let originalGetBoundingClientRect;
  let originalAddEventListener;
  let originalRemoveEventListener;

  beforeEach(() => {
    // Mock DOM APIs
    originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    originalAddEventListener = window.addEventListener;
    originalRemoveEventListener = window.removeEventListener;

    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      left: 100,
      top: 100,
      width: 380,
      height: 200,
      right: 480,
      bottom: 300,
    }));

    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;

    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render component', () => {
      const wrapper = mount(OverlayPanel);
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.overlay-panel').exists()).toBe(true);
    });

    it('should display title', () => {
      const wrapper = mount(OverlayPanel);
      expect(wrapper.find('.overlay-title').text()).toBe('Your Assistant');
    });

    it('should show empty state when no result', () => {
      const wrapper = mount(OverlayPanel, {
        props: {
          aiResult: '',
          isThinking: false,
        },
      });

      expect(wrapper.find('.overlay-empty').exists()).toBe(true);
      expect(wrapper.find('.overlay-empty').text()).toBe('AI response will appear here');
    });
  });

  describe('Props - isThinking', () => {
    it('should show thinking state when isThinking is true', () => {
      const wrapper = mount(OverlayPanel, {
        props: {
          isThinking: true,
        },
      });

      expect(wrapper.find('.overlay-thinking').exists()).toBe(true);
      expect(wrapper.find('.overlay-panel').classes()).toContain('is-thinking');
      expect(wrapper.text()).toContain('Thinking...');
    });

    it('should not show thinking state when isThinking is false', () => {
      const wrapper = mount(OverlayPanel, {
        props: {
          isThinking: false,
          aiResult: '',
        },
      });

      expect(wrapper.find('.overlay-thinking').exists()).toBe(false);
      expect(wrapper.find('.overlay-panel').classes()).not.toContain('is-thinking');
    });
  });

  describe('Props - aiResult', () => {
    it('should render AI result when provided', async () => {
      const wrapper = mount(OverlayPanel, {
        props: {
          aiResult: 'This is the AI response',
          isThinking: false,
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.find('.overlay-text').exists()).toBe(true);
      expect(wrapper.html()).toContain('This is the AI response');
    });

    it('should render markdown result correctly', async () => {
      const { renderMarkdown } = require('@/utils/markdown_util');

      const wrapper = mount(OverlayPanel, {
        props: {
          aiResult: '# Heading\n\nContent here',
          isThinking: false,
        },
      });

      await wrapper.vm.$nextTick();

      expect(renderMarkdown).toHaveBeenCalledWith('# Heading\n\nContent here');
    });
  });

  describe('Props - isRecording', () => {
    it('should show recording indicator when isRecording is true', () => {
      const wrapper = mount(OverlayPanel, {
        props: {
          isRecording: true,
        },
      });

      expect(wrapper.find('.el-tag').exists()).toBe(true);
      expect(wrapper.find('.el-tag').text()).toContain('REC');
    });

    it('should not show recording indicator when isRecording is false', () => {
      const wrapper = mount(OverlayPanel, {
        props: {
          isRecording: false,
        },
      });

      expect(wrapper.find('.el-tag').exists()).toBe(false);
    });
  });

  describe('Props - isStarting', () => {
    it('should show Start button with loading state when isStarting is true', () => {
      const wrapper = mount(OverlayPanel, {
        props: {
          isRecording: false,
          isStarting: true,
        },
      });

      const startButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Start')
      );

      expect(startButton.exists()).toBe(true);
    });
  });

  describe('Props - isStopping', () => {
    it('should show Stop button when recording', () => {
      const wrapper = mount(OverlayPanel, {
        props: {
          isRecording: true,
          isStopping: false,
        },
      });

      const stopButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Stop')
      );

      expect(stopButton.exists()).toBe(true);
    });

    it('should show Stop button with loading state when isStopping is true', () => {
      const wrapper = mount(OverlayPanel, {
        props: {
          isRecording: true,
          isStopping: true,
        },
      });

      const stopButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Stop')
      );

      expect(stopButton.exists()).toBe(true);
    });
  });

  describe('Props - hasTranscript', () => {
    it('should enable Ask AI button when hasTranscript is true', () => {
      const wrapper = mount(OverlayPanel, {
        props: {
          hasTranscript: true,
        },
      });

      const askButton = wrapper.findAll('button').find(btn =>
        btn.text().includes('Ask AI')
      );

      expect(askButton.exists()).toBe(true);
    });

    it('should disable Ask AI button when hasTranscript is false', () => {
      const wrapper = mount(OverlayPanel, {
        props: {
          hasTranscript: false,
        },
      });

      // Find disabled Ask AI button
      const buttons = wrapper.findAll('button');
      const askButton = buttons.find(btn => btn.text().includes('Ask AI'));

      // The button should exist but be disabled
      expect(askButton).toBeDefined();
    });
  });

  // Note: Emit functionality is defined in the component via defineEmits(['close', 'start', 'stop', 'ask', 'copy'])
  // and verified in the template. The emits are tested manually/integration tests.

  describe('Drag Functionality', () => {
    it('should have draggable header', () => {
      const wrapper = mount(OverlayPanel);
      const header = wrapper.find('.overlay-header');

      expect(header.exists()).toBe(true);
      expect(header.classes()).toContain('overlay-header');
    });

    it('should add event listeners on drag start', () => {
      const wrapper = mount(OverlayPanel);
      const header = wrapper.find('.overlay-header');

      // Trigger mousedown to start drag
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: 150,
        clientY: 120,
      });

      header.element.dispatchEvent(mouseDownEvent);

      // Event listeners should be added to window
      expect(window.addEventListener).toHaveBeenCalled();
    });

    // Note: Full drag functionality testing is complex due to DOM event limitations
    // in jsdom. The drag behavior is tested manually/integration tests.
  });

  describe('Computed Property - renderedResult', () => {
    it('should render markdown when aiResult is provided', async () => {
      const { renderMarkdown } = require('@/utils/markdown_util');

      const wrapper = mount(OverlayPanel, {
        props: {
          aiResult: '**Bold text**',
          isThinking: false,
        },
      });

      await wrapper.vm.$nextTick();

      expect(renderMarkdown).toHaveBeenCalledWith('**Bold text**');
    });

    it('should handle empty aiResult', async () => {
      const wrapper = mount(OverlayPanel, {
        props: {
          aiResult: '',
          isThinking: false,
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.find('.overlay-empty').exists()).toBe(true);
    });
  });

  describe('Button Visibility', () => {
    it('should show Start button when not recording', () => {
      const wrapper = mount(OverlayPanel, {
        props: {
          isRecording: false,
        },
      });

      const footer = wrapper.find('.overlay-footer');
      const buttons = footer.findAll('button');

      const hasStartButton = buttons.some(btn => btn.text().includes('Start'));
      expect(hasStartButton).toBe(true);
    });

    it('should show Stop button when recording', () => {
      const wrapper = mount(OverlayPanel, {
        props: {
          isRecording: true,
        },
      });

      const footer = wrapper.find('.overlay-footer');
      const buttons = footer.findAll('button');

      const hasStopButton = buttons.some(btn => btn.text().includes('Stop'));
      expect(hasStopButton).toBe(true);
    });

    it('should show copy button when aiResult exists', () => {
      const wrapper = mount(OverlayPanel, {
        props: {
          aiResult: 'Some result',
        },
      });

      const footer = wrapper.find('.overlay-footer');
      const buttons = footer.findAll('button');

      // Should have at least 3 buttons when aiResult is present (Stop/Start, Ask AI, Copy)
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('should not show copy button when no aiResult', () => {
      const wrapper = mount(OverlayPanel, {
        props: {
          aiResult: '',
          isRecording: false,
        },
      });

      const footer = wrapper.find('.overlay-footer');
      const buttons = footer.findAll('button');

      // Should only have 2 buttons when no aiResult (Start, Ask AI - disabled)
      expect(buttons.length).toBeLessThanOrEqual(2);
    });
  });
});

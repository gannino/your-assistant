/**
 * MarkdownViewer component tests
 * @component tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { mount, config } from '@vue/test-utils';
import MarkdownViewer from '@/components/MarkdownViewer.vue';

// Configure Vue Test Utils to use Element Plus
config.global.stubs = {
  ElButton: {
    name: 'ElButton',
    template: '<button @click="$emit(\'click\')"><slot /></button>',
  },
  ElIcon: {
    name: 'ElIcon',
    template: '<span class="el-icon"><slot /></span>',
  },
  ElMessage: {
    name: 'ElMessage',
    template: '<div class="el-message"><slot /></div>',
  },
};

// Mock useMobile composable
jest.mock('@/composables/useMobile', () => ({
  useMobile: jest.fn(() => ({ isMobile: { value: false } })),
}));

// Mock markdown_util
jest.mock('@/utils/markdown_util', () => ({
  renderMarkdown: jest.fn((text) => `<p>${text}</p>`),
}));

describe('MarkdownViewer.vue', () => {
  let originalGetBoundingClientRect;
  let originalAddEventListener;
  let originalRemoveEventListener;

  beforeEach(() => {
    // Mock DOM APIs
    originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    originalAddEventListener = document.addEventListener;
    originalRemoveEventListener = document.removeEventListener;

    document.addEventListener = jest.fn();
    document.removeEventListener = jest.fn();

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });

    // Mock URL and Blob APIs
    // Need to preserve URL constructor while mocking its methods
    const OriginalURL = global.URL;
    global.URL = class MockURL extends OriginalURL {
      static createObjectURL = jest.fn(() => 'blob:mock-url');
      static revokeObjectURL = jest.fn();

      constructor(url, base) {
        super(url, base);
        this.hostname = url ? url.replace(/^https?:\/\//, '').split('/')[0] : 'example.com';
      }
    };

    global.Blob = class Blob {
      constructor(parts, options) {
        this.parts = parts;
        this.options = options;
      }
    };

    // Mock document.body style
    document.body.style = {};

    // Mock window.innerHeight
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
  });

  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    document.addEventListener = originalAddEventListener;
    document.removeEventListener = originalRemoveEventListener;

    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render component', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test Document',
          markdownContent: '# Test Content',
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.markdown-viewer').exists()).toBe(true);
    });

    it('should display title', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test Document',
          markdownContent: '# Test Content',
        },
      });

      expect(wrapper.find('h3').text()).toBe('Test Document');
    });

    it('should show preview mode when content exists on mount', async () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test Document',
          markdownContent: '# Test Content',
        },
      });

      await wrapper.vm.$nextTick();

      // Preview mode should be enabled when content exists
      expect(wrapper.vm.showPreview).toBe(true);
    });

    it('should not show preview mode when no content on mount', async () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test Document',
          markdownContent: '',
        },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showPreview).toBe(false);
    });
  });

  describe('Props - title', () => {
    it('should display provided title', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Custom Title',
          markdownContent: 'Content',
        },
      });

      expect(wrapper.find('h3').text()).toBe('Custom Title');
    });

    it('should display default title when not provided', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          markdownContent: 'Content',
        },
      });

      expect(wrapper.find('h3').text()).toBe('Content');
    });
  });

  describe('Props - markdownContent', () => {
    it('should render markdown content', async () => {
      const { renderMarkdown } = require('@/utils/markdown_util');

      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: '# Heading\n\nContent',
        },
      });

      await wrapper.vm.$nextTick();

      expect(renderMarkdown).toHaveBeenCalledWith('# Heading\n\nContent');
    });

    it('should update local content when prop changes', async () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Initial content',
        },
      });

      await wrapper.setProps({ markdownContent: 'Updated content' });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.localMarkdownContent).toBe('Updated content');
    });

    it('should emit update when local content changes', async () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Initial content',
        },
      });

      wrapper.vm.localMarkdownContent = 'New local content';
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:markdownContent')).toBeTruthy();
      expect(wrapper.emitted('update:markdownContent')[0]).toEqual(['New local content']);
    });
  });

  describe('Props - sourceUrl', () => {
    it('should display source URL in footer', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
          sourceUrl: 'https://example.com/article',
        },
      });

      expect(wrapper.html()).toContain('example.com');
    });
  });

  describe('Props - fetchTime', () => {
    it('should display fetch time in footer', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
          fetchTime: '2.5s',
        },
      });

      expect(wrapper.html()).toContain('2.5s');
    });
  });

  describe('Props - isAttached', () => {
    it('should hide attach button when isAttached is true', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
          isAttached: true,
        },
      });

      // The "Attach to Context" button should not be present
      const buttons = wrapper.findAll('button');
      const attachButton = buttons.find(btn => btn.text().includes('Attach to Context'));
      expect(attachButton).toBeUndefined();
    });

    it('should show attach button when isAttached is false', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
          isAttached: false,
        },
      });

      // The "Attach to Context" button should be present
      const buttons = wrapper.findAll('button');
      const attachButton = buttons.find(btn => btn.text().includes('Attach to Context'));
      expect(attachButton).toBeDefined();
    });
  });

  describe('Computed Properties', () => {
    describe('renderedMarkdown', () => {
      it('should render markdown using renderMarkdown utility', async () => {
        const { renderMarkdown } = require('@/utils/markdown_util');

        const wrapper = mount(MarkdownViewer, {
          props: {
            title: 'Test',
            markdownContent: '**Bold** text',
          },
        });

        await wrapper.vm.$nextTick();

        expect(renderMarkdown).toHaveBeenCalledWith('**Bold** text');
      });
    });

    describe('wordCount', () => {
      it('should count words correctly', () => {
        const wrapper = mount(MarkdownViewer, {
          props: {
            title: 'Test',
            markdownContent: 'Hello world this is a test',
          },
        });

        expect(wrapper.vm.wordCount).toBe(6);
      });

      it('should handle punctuation correctly', () => {
        const wrapper = mount(MarkdownViewer, {
          props: {
            title: 'Test',
            markdownContent: 'Hello, world! How are you?',
          },
        });

        expect(wrapper.vm.wordCount).toBe(5);
      });

      it('should return 0 for empty content', () => {
        const wrapper = mount(MarkdownViewer, {
          props: {
            title: 'Test',
            markdownContent: '',
          },
        });

        expect(wrapper.vm.wordCount).toBe(0);
      });

      it('should handle content with only punctuation', () => {
        const wrapper = mount(MarkdownViewer, {
          props: {
            title: 'Test',
            markdownContent: '!@#$%^&*()',
          },
        });

        expect(wrapper.vm.wordCount).toBe(0);
      });
    });
  });

  describe('Methods - togglePreview', () => {
    it('should toggle preview mode', async () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
        },
      });

      const initialPreviewState = wrapper.vm.showPreview;

      wrapper.vm.togglePreview();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showPreview).toBe(!initialPreviewState);
    });
  });

  describe('Methods - toggleFullscreen', () => {
    it('should enable fullscreen mode', async () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
        },
      });

      wrapper.vm.toggleFullscreen();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isFullscreen).toBe(true);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should disable fullscreen mode', async () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
        },
      });

      // First enable fullscreen
      wrapper.vm.toggleFullscreen();
      await wrapper.vm.$nextTick();

      // Then disable it
      wrapper.vm.toggleFullscreen();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isFullscreen).toBe(false);
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Methods - downloadMarkdown', () => {
    it('should create blob and trigger download', async () => {
      const originalCreateElement = document.createElement;
      const mockElement = {
        href: '',
        download: '',
        click: jest.fn(),
        style: {},
      };
      // Only mock 'a' tag creation
      document.createElement = jest.fn((tag) => {
        if (tag === 'a') {
          return mockElement;
        }
        return originalCreateElement.call(document, tag);
      });

      const originalAppendChild = document.body.appendChild;
      const originalRemoveChild = document.body.removeChild;
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test Document',
          markdownContent: '# Test Content',
          sourceUrl: 'https://example.com/article',
        },
      });

      wrapper.vm.downloadMarkdown();
      await wrapper.vm.$nextTick();

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockElement.click).toHaveBeenCalled();

      // Restore original methods
      document.createElement = originalCreateElement;
      document.body.appendChild = originalAppendChild;
      document.body.removeChild = originalRemoveChild;
    });

    it('should show success toast after download', async () => {
      const originalCreateElement = document.createElement;
      const mockElement = {
        href: '',
        download: '',
        click: jest.fn(),
        style: {},
      };
      document.createElement = jest.fn((tag) => {
        if (tag === 'a') {
          return mockElement;
        }
        return originalCreateElement.call(document, tag);
      });

      const originalAppendChild = document.body.appendChild;
      const originalRemoveChild = document.body.removeChild;
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
          sourceUrl: 'https://example.com',
        },
      });

      wrapper.vm.downloadMarkdown();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.toastMessage).toBe('Markdown downloaded successfully');
      expect(wrapper.vm.toastType).toBe('success');
      expect(wrapper.vm.showToast).toBe(true);

      // Restore original methods
      document.createElement = originalCreateElement;
      document.body.appendChild = originalAppendChild;
      document.body.removeChild = originalRemoveChild;
    });
  });

  describe('Methods - copyToClipboard', () => {
    it('should copy content to clipboard and show success toast', async () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content to copy',
        },
      });

      await wrapper.vm.copyToClipboard();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Content to copy');
      expect(wrapper.vm.toastMessage).toBe('Content copied to clipboard');
      expect(wrapper.vm.toastType).toBe('success');
    });

    it('should show error toast on clipboard failure', async () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
        },
      });

      navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Clipboard error'));

      await wrapper.vm.copyToClipboard();

      expect(wrapper.vm.toastMessage).toBe('Failed to copy to clipboard');
      expect(wrapper.vm.toastType).toBe('error');
    });
  });

  describe('Methods - closeViewer', () => {
    it('should emit close event', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
        },
      });

      wrapper.vm.closeViewer();

      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Methods - attachToContext', () => {
    it('should emit attach event with correct payload', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test Document',
          markdownContent: 'Content to attach',
          sourceUrl: 'https://example.com',
        },
      });

      wrapper.vm.attachToContext();

      expect(wrapper.emitted('attach')).toBeTruthy();
      expect(wrapper.emitted('attach')[0][0]).toEqual({
        name: 'Test Document',
        markdown: 'Content to attach',
        source: 'website',
        url: 'https://example.com',
        size: 17,
      });
    });

    it('should use local content if it differs from prop', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Original',
          sourceUrl: 'https://example.com',
        },
      });

      wrapper.vm.localMarkdownContent = 'Modified content';

      wrapper.vm.attachToContext();

      expect(wrapper.emitted('attach')[0][0].markdown).toBe('Modified content');
    });

    it('should show success toast after attaching', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
          sourceUrl: 'https://example.com',
        },
      });

      wrapper.vm.attachToContext();

      expect(wrapper.vm.toastMessage).toBe('Content attached to context');
      expect(wrapper.vm.toastType).toBe('success');
    });
  });

  describe('Methods - showToastMessage', () => {
    it('should show toast with default success type', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
        },
      });

      wrapper.vm.showToastMessage('Test message');

      expect(wrapper.vm.toastMessage).toBe('Test message');
      expect(wrapper.vm.toastType).toBe('success');
      expect(wrapper.vm.showToast).toBe(true);
    });

    it('should show toast with custom type', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
        },
      });

      wrapper.vm.showToastMessage('Error message', 'error');

      expect(wrapper.vm.toastMessage).toBe('Error message');
      expect(wrapper.vm.toastType).toBe('error');
    });

    it('should hide toast after timeout', async () => {
      jest.useFakeTimers();

      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
        },
      });

      wrapper.vm.showToastMessage('Test');

      expect(wrapper.vm.showToast).toBe(true);

      jest.advanceTimersByTime(2000);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showToast).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('Resize Functionality', () => {
    it('should start resize on mousedown', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
        },
      });

      const resizeHandle = wrapper.find('.resize-handle');
      expect(resizeHandle.exists()).toBe(true);

      resizeHandle.trigger('mousedown', { clientY: 100 });

      expect(wrapper.vm.isResizing).toBe(true);
    });

    it('should update height during resize', async () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
        },
      });

      wrapper.vm.startResize({ clientY: 100 });
      wrapper.vm.handleResize({ clientY: 150 });

      expect(wrapper.vm.editorHeight).toBe(450);
    });

    it('should enforce minimum height constraint', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
        },
      });

      wrapper.vm.startResize({ clientY: 100 });
      wrapper.vm.handleResize({ clientY: 500 }); // Try to go below minimum

      expect(wrapper.vm.editorHeight).toBeGreaterThanOrEqual(200);
    });

    it('should enforce maximum height constraint', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
        },
      });

      Object.defineProperty(window, 'innerHeight', { value: 800 });

      wrapper.vm.startResize({ clientY: 100 });
      wrapper.vm.handleResize({ clientY: -500 }); // Try to go above maximum

      expect(wrapper.vm.editorHeight).toBeLessThanOrEqual(600); // 800 - 200
    });

    it('should stop resize on mouseup', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
        },
      });

      wrapper.vm.startResize({ clientY: 100 });
      wrapper.vm.endResize();

      expect(wrapper.vm.isResizing).toBe(false);
    });

    it('should add event listeners during resize', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
        },
      });

      wrapper.vm.startResize({ clientY: 100 });

      expect(document.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(document.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });

    it('should remove event listeners after resize', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
        },
      });

      wrapper.vm.startResize({ clientY: 100 });
      wrapper.vm.endResize();

      expect(document.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });
  });

  describe('Watchers', () => {
    it('should sync local content when prop changes', async () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Initial',
        },
      });

      await wrapper.setProps({ markdownContent: 'Updated' });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.localMarkdownContent).toBe('Updated');
    });

    it('should emit update when local content changes and differs from prop', async () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Initial',
        },
      });

      wrapper.vm.localMarkdownContent = 'Changed';
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:markdownContent')).toBeTruthy();
    });

    it('should not emit update when local content matches prop', async () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Same',
        },
      });

      wrapper.vm.localMarkdownContent = 'Same';
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:markdownContent')).toBeFalsy();
    });
  });

  describe('Editor and Preview Sections', () => {
    it('should render editor textarea', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
        },
      });

      expect(wrapper.find('.markdown-editor').exists()).toBe(true);
    });

    it('should display character count', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Hello',
        },
      });

      expect(wrapper.find('.char-count').exists()).toBe(true);
    });

    it('should display word count in preview', async () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Hello world',
        },
      });

      // Ensure preview mode is active
      wrapper.vm.showPreview = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.word-count').exists()).toBe(true);
    });
  });

  describe('Mobile Mode', () => {
    it('should apply mobile class when isMobile is true', () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
          isMobile: true,
        },
      });

      expect(wrapper.find('.markdown-viewer.is-mobile').exists()).toBe(true);
    });
  });

  describe('Fullscreen Mode', () => {
    it('should apply fullscreen class when fullscreen is active', async () => {
      const wrapper = mount(MarkdownViewer, {
        props: {
          title: 'Test',
          markdownContent: 'Content',
        },
      });

      wrapper.vm.isFullscreen = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.markdown-viewer.is-fullscreen').exists()).toBe(true);
    });
  });
});

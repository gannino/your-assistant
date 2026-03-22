/**
 * ContentSettings component tests
 * @component tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { mount, config } from '@vue/test-utils';
import ContentSettings from '@/views/settings/ContentSettings.vue';

// Configure Vue Test Utils to use Element Plus
config.global.stubs = {
  SettingsLayout: {
    name: 'SettingsLayout',
    template: '<div class="settings-layout"><slot /></div>',
  },
  ElInput: {
    name: 'ElInput',
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @change="$emit(\'change\', $event.target.value)" @keyup.enter="$emit(\'keyup.enter\', $event)">',
    props: ['modelValue', 'placeholder', 'type', 'rows', 'disabled'],
  },
  ElButton: {
    name: 'ElButton',
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['loading', 'icon', 'size', 'type', 'disabled'],
  },
  ElIcon: {
    name: 'ElIcon',
    template: '<span class="el-icon"><slot /></span>',
  },
  ElTag: {
    name: 'ElTag',
    template: '<span class="el-tag">{{ content }}</span>',
    props: ['content', 'size', 'type'],
  },
  ElCollapse: {
    name: 'ElCollapse',
    template: '<div class="el-collapse"><slot /></div>',
  },
  ElCollapseItem: {
    name: 'ElCollapseItem',
    template: '<div class="el-collapse-item"><slot /></div>',
  },
  ElUpload: {
    name: 'ElUpload',
    template: '<div class="el-upload"><slot /></div>',
    props: ['autoUpload', 'onChange', 'beforeUpload', 'accept', 'limit', 'fileList', 'drag', 'multiple'],
  },
  ElAlert: {
    name: 'ElAlert',
    template: '<div v-if="false" class="el-alert"></div>',
    props: ['type', 'closable', 'title'],
  },
  ElText: {
    name: 'ElText',
    template: '<span class="el-text">{{ content }}</span>',
    props: ['type', 'size'],
  },
  ElMessageBox: {
    confirm: jest.fn(() => Promise.resolve('confirm')),
  },
  ElMessage: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
};

// Mock website_util
jest.mock('@/utils/website_util', () => ({
  fetchAndConvertWebsite: jest.fn(() => Promise.resolve({ content: 'Test website content', url: 'https://example.com' })),
}));

// Mock pdf_util
jest.mock('@/utils/pdf_util', () => ({
  extractTextFromPDF: jest.fn(() => Promise.resolve({ markdown: 'Test PDF content', pages: 5, lines: 100 })),
}));

// Mock providerRegistry
jest.mock('@/services/ai/providerRegistry', () => ({
  providerRegistry: {
    get: jest.fn(() => ({
      getProviderInfo: () => ({ supportsStreaming: true }),
    })),
  },
}));

describe('ContentSettings.vue', () => {
  beforeEach(() => {
    // Mock localStorage
    localStorage.clear();

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
      const wrapper = mount(ContentSettings);
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.content-settings').exists()).toBe(true);
    });

    it('should render info text with documentation link', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.html()).toContain('View documentation');
    });

    it('should render system prompt section', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.html()).toContain('System Prompt');
    });

    it('should render website content section', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.html()).toContain('Website Content');
    });

    it('should render PDF attachments section', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.html()).toContain('PDF Attachments');
    });

    it('should render summarize context section', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.html()).toContain('Summarize Context');
    });
  });

  describe('Default Values', () => {
    it('should have default system prompt', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.vm.gpt_system_prompt).toBeDefined();
    });

    it('should have empty website URL', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.vm.websiteUrl).toBe('');
    });

    it('should have empty manual website content', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.vm.manualWebsiteContent).toBe('');
    });

    it('should have empty website attachments', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.vm.websiteAttachments).toEqual([]);
    });

    it('should have empty PDF attachments', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.vm.pdfAttachments).toEqual([]);
    });

    it('should have empty PDF file list', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.vm.pdfFileList).toEqual([]);
    });

    it('should have default state values', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.vm.fetchingWebsite).toBe(false);
      expect(wrapper.vm.isPreparingContext).toBe(false);
      expect(wrapper.vm.preparedContext).toBeNull();
      expect(wrapper.vm.showContextPreview).toBe(false);
      expect(wrapper.vm.preparationProgress).toBe('');
    });

    it('should have default cache metadata', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.vm.contextCacheMetadata).toEqual({
        timestamp: null,
        documentCount: 0,
        totalChars: 0,
        version: '1.0',
      });
    });
  });

  describe('Computed Properties', () => {
    it('should calculate attachment count correctly', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.vm.attachmentCount).toBe('');

      wrapper.vm.websiteAttachments = [{ name: 'site1' }];
      expect(wrapper.vm.attachmentCount).toBe('1 site');

      wrapper.vm.pdfAttachments = [{ name: 'pdf1' }];
      expect(wrapper.vm.attachmentCount).toBe('1 PDF + 1 site');
    });

    it('should calculate github URL correctly', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.vm.github_url).toContain('github.com');
      expect(wrapper.vm.github_url).toContain('your-assistant');
    });
  });

  describe('System Prompt', () => {
    it('should save system prompt to localStorage on change', () => {
      const wrapper = mount(ContentSettings);
      wrapper.vm.gpt_system_prompt = 'You are a helpful assistant.';
      wrapper.vm.onKeyChange('gpt_system_prompt');
      expect(localStorage.getItem('gpt_system_prompt')).toBe('You are a helpful assistant.');
    });
  });

  describe('Website Attachments', () => {
    it('should add website attachment', () => {
      const wrapper = mount(ContentSettings);
      const site = { name: 'Test Site', lines: 100, markdown: 'content' };
      wrapper.vm.websiteAttachments.push(site);
      expect(wrapper.vm.websiteAttachments).toContainEqual(site);
    });

    it('should remove website attachment by index', () => {
      const wrapper = mount(ContentSettings);
      wrapper.vm.websiteAttachments = [
        { name: 'Site 1', lines: 100, markdown: 'content1' },
        { name: 'Site 2', lines: 200, markdown: 'content2' },
      ];
      wrapper.vm.removeWebsite(0);
      expect(wrapper.vm.websiteAttachments).toHaveLength(1);
      expect(wrapper.vm.websiteAttachments[0].name).toBe('Site 2');
    });
  });

  describe('PDF Attachments', () => {
    it('should add PDF attachment', () => {
      const wrapper = mount(ContentSettings);
      const pdf = { name: 'Test.pdf', lines: 50, pages: 5, size: 1024 };
      wrapper.vm.pdfAttachments.push(pdf);
      expect(wrapper.vm.pdfAttachments).toContainEqual(pdf);
    });

    it('should remove PDF attachment by index', () => {
      const wrapper = mount(ContentSettings);
      wrapper.vm.pdfAttachments = [
        { name: 'PDF 1', lines: 100, pages: 5, size: 1024 },
        { name: 'PDF 2', lines: 200, pages: 10, size: 2048 },
      ];
      wrapper.vm.removePDF(0);
      expect(wrapper.vm.pdfAttachments).toHaveLength(1);
      expect(wrapper.vm.pdfAttachments[0].name).toBe('PDF 2');
    });

    it('should clear all PDFs', () => {
      const wrapper = mount(ContentSettings);
      wrapper.vm.pdfAttachments = [
        { name: 'PDF 1', lines: 100, pages: 5, size: 1024 },
        { name: 'PDF 2', lines: 200, pages: 10, size: 2048 },
      ];
      wrapper.vm.clearAllPDFs();
      expect(wrapper.vm.pdfAttachments).toEqual([]);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.vm.formatFileSize(1024)).toBe('1.0 KB');
      expect(wrapper.vm.formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(wrapper.vm.formatFileSize(1024 * 1024 * 10)).toBe('10.0 MB');
    });
  });

  describe('formatCacheTimestamp', () => {
    it('should return empty string for null timestamp', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.vm.formatCacheTimestamp(null)).toBe('');
    });

    it('should return "just now" for recent timestamps', () => {
      const wrapper = mount(ContentSettings);
      const now = new Date();
      expect(wrapper.vm.formatCacheTimestamp(now.toISOString())).toBe('just now');
    });

    it('should return "Xm ago" for minute differences', () => {
      const wrapper = mount(ContentSettings);
      const date = new Date(Date.now() - 5 * 60000); // 5 minutes ago
      expect(wrapper.vm.formatCacheTimestamp(date.toISOString())).toBe('5m ago');
    });

    it('should return "Xh ago" for hour differences', () => {
      const wrapper = mount(ContentSettings);
      const date = new Date(Date.now() - 2 * 3600000); // 2 hours ago
      expect(wrapper.vm.formatCacheTimestamp(date.toISOString())).toBe('2h ago');
    });

    it('should return date string for old timestamps', () => {
      const wrapper = mount(ContentSettings);
      const date = new Date('2024-01-01');
      expect(wrapper.vm.formatCacheTimestamp(date.toISOString())).toBe(date.toLocaleDateString());
    });
  });

  describe('Context Management', () => {
    it('should have getAllContextAttachments method', () => {
      const wrapper = mount(ContentSettings);
      expect(typeof wrapper.vm.getAllContextAttachments).toBe('function');
    });

    it('should have getPlatformLimits method', () => {
      const wrapper = mount(ContentSettings);
      expect(typeof wrapper.vm.getPlatformLimits).toBe('function');
    });

    it('should return combined attachments from getAllContextAttachments', () => {
      const wrapper = mount(ContentSettings);
      wrapper.vm.websiteAttachments = [
        { name: 'Site 1', lines: 100, markdown: 'content1' },
      ];
      wrapper.vm.pdfAttachments = [
        { name: 'PDF 1', lines: 200, markdown: 'content2' },
      ];
      const all = wrapper.vm.getAllContextAttachments();
      expect(all).toHaveLength(2);
    });
  });

  describe('CSS Classes', () => {
    it('should apply content-settings class', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.find('.content-settings').exists()).toBe(true);
    });

    it('should have info-text class', () => {
      const wrapper = mount(ContentSettings);
      expect(wrapper.find('.info-text').exists()).toBe(true);
    });

    it('should have settings-section classes', () => {
      const wrapper = mount(ContentSettings);
      const sections = wrapper.findAll('.settings-section');
      expect(sections.length).toBeGreaterThan(0);
    });
  });

  describe('Manual Website Content', () => {
    it('should add manual website content', () => {
      const wrapper = mount(ContentSettings);
      wrapper.vm.manualWebsiteContent = 'Manual content here';
      wrapper.vm.addManualWebsiteContent();
      expect(wrapper.vm.websiteAttachments.length).toBeGreaterThan(0);
    });

    it('should not add empty content', () => {
      const wrapper = mount(ContentSettings);
      wrapper.vm.manualWebsiteContent = '';
      wrapper.vm.addManualWebsiteContent();
      expect(wrapper.vm.websiteAttachments.length).toBe(0);
    });
  });

  describe('loadPreparedContext', () => {
    it('should return false when no cached context exists', () => {
      const wrapper = mount(ContentSettings);
      const result = wrapper.vm.loadPreparedContext();
      expect(result).toBe(false);
    });

    it('should load cached context from localStorage', () => {
      localStorage.setItem('prepared_context', JSON.stringify({
        context: 'Cached context',
        metadata: {
          timestamp: new Date().toISOString(),
          documentCount: 2,
          totalChars: 100,
          version: '1.0',
        },
      }));

      const wrapper = mount(ContentSettings);
      const result = wrapper.vm.loadPreparedContext();
      expect(result).toBe(true);
      expect(wrapper.vm.preparedContext).toBe('Cached context');
    });

    it('should handle invalid cached data gracefully', () => {
      localStorage.setItem('prepared_context', 'invalid json');

      const wrapper = mount(ContentSettings);
      const result = wrapper.vm.loadPreparedContext();
      expect(result).toBe(false);
      expect(localStorage.getItem('prepared_context')).toBeNull();
    });
  });
});

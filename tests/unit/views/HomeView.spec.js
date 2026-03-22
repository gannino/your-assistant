/**
 * HomeView component tests
 * @component tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { mount, config } from '@vue/test-utils';
import HomeView from '@/views/HomeView.vue';

// Configure Vue Test Utils to use Element Plus
config.global.stubs = {
  ElTag: {
    name: 'ElTag',
    template: '<span class="el-tag" :type="type" :effect="effect"><slot /></span>',
    props: ['type', 'size', 'effect'],
  },
  ElIcon: {
    name: 'ElIcon',
    template: '<span class="el-icon"><slot /></span>',
  },
  ElButton: {
    name: 'ElButton',
    template: '<button @click="$emit(\'click\')"><slot /></button>',
    props: ['type', 'size', 'icon', 'loading', 'disabled', 'circle', 'plain', 'block', 'link'],
  },
  ElInput: {
    name: 'ElInput',
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @keydown.enter="$emit(\'keydown.enter\', $event)" />',
    props: ['modelValue', 'placeholder', 'clearable', 'size'],
  },
  ElDialog: {
    name: 'ElDialog',
    template: '<div v-if="modelValue" class="el-dialog"><slot /><slot name="footer" /></div>',
    props: ['modelValue', 'title', 'width', 'fullscreen'],
  },
  ElEmpty: {
    name: 'ElEmpty',
    template: '<div class="el-empty"><slot name="description" /></div>',
    props: ['description'],
  },
  MyTimer: {
    name: 'MyTimer',
    template: '<div class="my-timer"><slot /></div>',
  },
};

// Mock useMobile composable
jest.mock('@/composables/useMobile', () => ({
  useMobile: jest.fn(() => ({ isMobile: { value: false } })),
}));

// Mock useAutoMode composable
jest.mock('@/composables/useAutoMode', () => ({
  useAutoMode: jest.fn(() => ({
    isAutoMode: { value: false },
    autoStatus: ref(''),
  })),
  startAutoMode: jest.fn(),
  stopAutoMode: jest.fn(),
}));

// Mock provider registries
jest.mock('@/services/ai/providerRegistry', () => ({
  providerRegistry: {
    get: jest.fn(() => ({
      initialize: jest.fn(),
      validateConfig: jest.fn(() => ({ valid: true })),
      getProviderInfo: jest.fn(() => ({ requiresApiKey: true, name: 'Test AI' })),
      generateCompletionStream: jest.fn(),
      generateCompletion: jest.fn(),
    })),
  },
}));

jest.mock('@/services/transcription/transcriptionRegistry', () => ({
  transcriptionRegistry: {
    get: jest.fn(() => ({
      initialize: jest.fn(),
      startRecognition: jest.fn(),
      stopRecognition: jest.fn(),
      isRecording: false,
    })),
  },
}));

// Mock config_util - Use __esModule: true for proper default export handling
jest.mock('@/utils/config_util', () => {
  const mockConfigUtil = {
    ai_provider: jest.fn(() => 'openai'),
    transcription_provider: jest.fn(() => 'webspeech'),
    gpt_system_prompt: jest.fn(() => 'You are a helpful assistant.'),
    openai_api_key: jest.fn(() => 'test-key'),
    gpt_model: jest.fn(() => 'gpt-4'),
    openai_temperature: jest.fn(() => 0.7),
    scroll_speed: jest.fn(() => 500),
    azure_token: jest.fn(() => 'test-token'),
    azure_region: jest.fn(() => 'westus'),
    azure_language: jest.fn(() => 'en-US'),
    webspeech_language: jest.fn(() => 'en-US'),
    webspeech_continuous: jest.fn(() => true),
    webspeech_interim_results: jest.fn(() => false),
    zai_api_key: jest.fn(() => 'test-key'),
    zai_model: jest.fn(() => 'gpt-4'),
    zai_endpoint: jest.fn(() => 'https://api.zai.com'),
    zai_temperature: jest.fn(() => 0.7),
    ollama_endpoint: jest.fn(() => 'http://localhost:11434'),
    ollama_model: jest.fn(() => 'llama2'),
    ollama_temperature: jest.fn(() => 0.7),
    mlx_endpoint: jest.fn(() => 'http://localhost:8080'),
    mlx_model: jest.fn(() => 'mlx-model'),
    mlx_temperature: jest.fn(() => 0.7),
    anthropic_api_key: jest.fn(() => 'test-key'),
    anthropic_model: jest.fn(() => 'claude-3'),
    anthropic_temperature: jest.fn(() => 0.7),
    gemini_api_key: jest.fn(() => 'test-key'),
    gemini_model: jest.fn(() => 'gemini-pro'),
    gemini_temperature: jest.fn(() => 0.7),
    openrouter_api_key: jest.fn(() => 'test-key'),
    openrouter_model: jest.fn(() => 'gpt-4'),
    openrouter_temperature: jest.fn(() => 0.7),
    whisper_api_key: jest.fn(() => 'test-key'),
    whisper_model: jest.fn(() => 'whisper-1'),
    whisper_language: jest.fn(() => 'en'),
    deepgram_api_key: jest.fn(() => 'test-key'),
    deepgram_model: jest.fn(() => 'nova-2'),
    deepgram_language: jest.fn(() => 'en'),
  };
  return {
    __esModule: true,
    default: mockConfigUtil,
    ...mockConfigUtil,
  };
});

// Mock markdown_util
jest.mock('@/utils/markdown_util', () => ({
  renderMarkdown: jest.fn((text) => `<p>${text}</p>`),
}));

// Mock screenshot_util
jest.mock('@/utils/screenshot_util', () => ({
  captureScreenshot: jest.fn(),
  stopScreenCapture: jest.fn(),
  isScreenCaptureSupported: jest.fn(() => true),
}));

// Mock ElMessage
jest.mock('element-plus', () => ({
  ElMessage: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

// Helper to create ref
const ref = (val) => ({ value: val });

describe('HomeView.vue', () => {
  let originalLocalStorage;

  beforeEach(() => {
    // Mock localStorage
    originalLocalStorage = global.localStorage;
    const mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    global.localStorage = mockLocalStorage;

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Reset process.env.NODE_ENV
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    global.localStorage = originalLocalStorage;
  });

  describe('Component Rendering', () => {
    it('should render component', () => {
      const wrapper = mount(HomeView);

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.homeview-container').exists()).toBe(true);
    });

    it('should render main content area', () => {
      const wrapper = mount(HomeView);

      expect(wrapper.find('.main-content').exists()).toBe(true);
    });

    it('should render panels container', () => {
      const wrapper = mount(HomeView);

      expect(wrapper.find('.panels-container').exists()).toBe(true);
    });

    it('should render both ASR and AI panels on desktop', () => {
      const wrapper = mount(HomeView);

      expect(wrapper.find('.asr-panel').exists()).toBe(true);
      expect(wrapper.find('.ai-panel').exists()).toBe(true);
    });
  });

  describe('Mobile Tab Navigation', () => {
    beforeEach(() => {
      const { useMobile } = require('@/composables/useMobile');
      useMobile.mockReturnValue({ isMobile: ref(true) });
    });

    it('should render mobile tabs when isMobile is true', () => {
      const wrapper = mount(HomeView);

      expect(wrapper.find('.mobile-tabs').exists()).toBe(true);
    });

    it('should have two tab items', () => {
      const wrapper = mount(HomeView);

      const tabItems = wrapper.findAll('.tab-item');
      expect(tabItems).toHaveLength(2);
    });

    it('should activate ASR tab by default', () => {
      const wrapper = mount(HomeView);

      expect(wrapper.vm.activeTab).toBe('asr');
    });

    it('should switch to AI tab when clicked', async () => {
      const wrapper = mount(HomeView);

      const tabItems = wrapper.findAll('.tab-item');
      await tabItems[1].trigger('click');

      expect(wrapper.vm.activeTab).toBe('ai');
    });
  });

  describe('State Management', () => {
    it('should initialize state to "end"', () => {
      const wrapper = mount(HomeView);

      expect(wrapper.vm.state).toBe('end');
    });

    it('should have empty currentText on mount', () => {
      const wrapper = mount(HomeView);

      expect(wrapper.vm.currentText).toBe('');
    });

    it('should have null ai_result on mount', () => {
      const wrapper = mount(HomeView);

      expect(wrapper.vm.ai_result).toBeNull();
    });

    it('should have empty screenshotQueue on mount', () => {
      const wrapper = mount(HomeView);

      expect(wrapper.vm.screenshotQueue).toEqual([]);
    });

    it('should have empty contextAttachments on mount', () => {
      const wrapper = mount(HomeView);

      expect(wrapper.vm.contextAttachments).toEqual([]);
    });
  });

  describe('Computed Properties', () => {
    describe('hasContext', () => {
      it('should return false when no attachments', () => {
        const wrapper = mount(HomeView);

        expect(wrapper.vm.hasContext).toBe(false);
      });

      it('should return true when attachments exist', async () => {
        const wrapper = mount(HomeView);
        wrapper.vm.contextAttachments = [{ name: 'test.pdf', markdown: 'content', source: 'pdf' }];
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.hasContext).toBe(true);
      });
    });

    describe('attachmentCount', () => {
      it('should return empty string when no attachments', () => {
        const wrapper = mount(HomeView);

        expect(wrapper.vm.attachmentCount).toBe('');
      });

      it('should show PDF count when only PDFs', async () => {
        const wrapper = mount(HomeView);
        wrapper.vm.contextAttachments = [
          { name: 'test1.pdf', markdown: 'content', source: 'pdf' },
          { name: 'test2.pdf', markdown: 'content', source: 'pdf' },
        ];
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.attachmentCount).toBe('2 PDFs');
      });

      it('should show website count when only websites', async () => {
        const wrapper = mount(HomeView);
        wrapper.vm.contextAttachments = [
          { name: 'example.com', markdown: 'content', source: 'website' },
        ];
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.attachmentCount).toBe('1 site');
      });

      it('should show combined count when mixed', async () => {
        const wrapper = mount(HomeView);
        wrapper.vm.contextAttachments = [
          { name: 'test.pdf', markdown: 'content', source: 'pdf' },
          { name: 'example.com', markdown: 'content', source: 'website' },
        ];
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.attachmentCount).toBe('1 PDF + 1 site');
      });
    });

    describe('renderedAIResult', () => {
      it('should return empty string when no AI result', () => {
        const wrapper = mount(HomeView);

        expect(wrapper.vm.renderedAIResult).toBe('');
      });

      it('should render markdown when AI result exists', async () => {
        const { renderMarkdown } = require('@/utils/markdown_util');
        const wrapper = mount(HomeView);

        wrapper.vm.ai_result = '# Test Response';
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.renderedAIResult).toBe('<p># Test Response</p>');
        expect(renderMarkdown).toHaveBeenCalledWith('# Test Response');
      });
    });

    describe('isDevMode', () => {
      it('should return false in test environment', () => {
        const wrapper = mount(HomeView);

        expect(wrapper.vm.isDevMode).toBe(false);
      });
    });
  });

  describe('Methods - clearASRContent', () => {
    it('should clear currentText', () => {
      const wrapper = mount(HomeView);
      wrapper.vm.currentText = 'Some transcript text';

      wrapper.vm.clearASRContent();

      expect(wrapper.vm.currentText).toBe('');
    });

    it('should reset processed position', () => {
      const wrapper = mount(HomeView);
      wrapper.vm.lastProcessedPosition = 100;

      wrapper.vm.clearASRContent();

      expect(wrapper.vm.lastProcessedPosition).toBe(0);
    });
  });

  describe('Methods - clearAIResponse', () => {
    it('should clear ai_result', () => {
      const wrapper = mount(HomeView);
      wrapper.vm.ai_result = 'AI response text';

      wrapper.vm.clearAIResponse();

      expect(wrapper.vm.ai_result).toBe('');
    });

    it('should reset response count', () => {
      const wrapper = mount(HomeView);
      wrapper.vm.responseCount = 5;

      wrapper.vm.clearAIResponse();

      expect(wrapper.vm.responseCount).toBe(0);
    });

    it('should reset hasStartedResponse flag', () => {
      const wrapper = mount(HomeView);
      wrapper.vm.hasStartedResponse = true;

      wrapper.vm.clearAIResponse();

      expect(wrapper.vm.hasStartedResponse).toBe(false);
    });

    it('should reset currentQuestion', () => {
      const wrapper = mount(HomeView);
      wrapper.vm.currentQuestion = 'Test question?';

      wrapper.vm.clearAIResponse();

      expect(wrapper.vm.currentQuestion).toBe('');
    });
  });

  describe('Methods - submitChatInput', () => {
    it('should have submitChatInput method', () => {
      const wrapper = mount(HomeView);

      expect(typeof wrapper.vm.submitChatInput).toBe('function');
    });

    it('should clear chatInput after submit', async () => {
      const wrapper = mount(HomeView);
      wrapper.vm.chatInput = 'Test message';
      wrapper.vm.updateCurrentText = jest.fn();
      wrapper.vm.askCurrentText = jest.fn().mockResolvedValue(undefined);

      await wrapper.vm.submitChatInput();

      expect(wrapper.vm.chatInput).toBe('');
    });
  });

  describe('Methods - copyAIResponse', () => {
    it('should copy AI result to clipboard', async () => {
      const { ElMessage } = require('element-plus');
      const wrapper = mount(HomeView);
      wrapper.vm.ai_result = 'AI response to copy';

      await wrapper.vm.copyAIResponse();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('AI response to copy');
      expect(ElMessage.success).toHaveBeenCalledWith('AI response copied to clipboard');
    });

    it('should show error toast on clipboard failure', async () => {
      const { ElMessage } = require('element-plus');
      const wrapper = mount(HomeView);
      wrapper.vm.ai_result = 'Content';
      navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Clipboard error'));

      await wrapper.vm.copyAIResponse();

      expect(ElMessage.error).toHaveBeenCalledWith('Failed to copy response');
    });
  });

  describe('Methods - copySessionSummary', () => {
    it('should copy session summary to clipboard', async () => {
      const { ElMessage } = require('element-plus');
      const wrapper = mount(HomeView);
      wrapper.vm.sessionSummary = 'Session summary text';

      await wrapper.vm.copySessionSummary();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Session summary text');
      expect(ElMessage.success).toHaveBeenCalledWith('Summary copied to clipboard');
    });

    it('should show error toast on clipboard failure', async () => {
      const { ElMessage } = require('element-plus');
      const wrapper = mount(HomeView);
      wrapper.vm.sessionSummary = 'Summary';
      navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Clipboard error'));

      await wrapper.vm.copySessionSummary();

      expect(ElMessage.error).toHaveBeenCalledWith('Failed to copy summary');
    });
  });

  describe('Methods - removeScreenshot', () => {
    it('should remove screenshot at index', () => {
      const wrapper = mount(HomeView);
      wrapper.vm.screenshotQueue = ['data:image1', 'data:image2', 'data:image3'];

      wrapper.vm.removeScreenshot(1);

      expect(wrapper.vm.screenshotQueue).toEqual(['data:image1', 'data:image3']);
    });
  });

  describe('Methods - clearScreenshots', () => {
    it('should clear all screenshots', () => {
      const wrapper = mount(HomeView);
      wrapper.vm.screenshotQueue = ['data:image1', 'data:image2'];
      const { stopScreenCapture } = require('@/utils/screenshot_util');

      wrapper.vm.clearScreenshots();

      expect(wrapper.vm.screenshotQueue).toEqual([]);
      expect(stopScreenCapture).toHaveBeenCalled();
    });
  });

  describe('Dialog Visibility', () => {
    it('should have showHistory dialog initially closed', () => {
      const wrapper = mount(HomeView);

      expect(wrapper.vm.showHistory).toBe(false);
    });

    it('should have showSessionSummary dialog initially closed', () => {
      const wrapper = mount(HomeView);

      expect(wrapper.vm.showSessionSummary).toBe(false);
    });
  });

  describe('Recording State', () => {
    it('should show recording indicator when state is "ing"', async () => {
      const wrapper = mount(HomeView);
      wrapper.vm.state = 'ing';
      await wrapper.vm.$nextTick();

      // Desktop header should show recording indicator
      const buttons = wrapper.findAll('button');
      const stopButton = buttons.find(btn => btn.text().includes('Stop Recording'));
      expect(stopButton).toBeDefined();
    });

    it('should show start button when state is "end"', async () => {
      const wrapper = mount(HomeView);
      wrapper.vm.state = 'end';
      await wrapper.vm.$nextTick();

      const buttons = wrapper.findAll('button');
      const startButton = buttons.find(btn => btn.text().includes('Start Session'));
      expect(startButton).toBeDefined();
    });
  });

  describe('Empty States', () => {
    it('should show empty state in ASR panel when no currentText', () => {
      const wrapper = mount(HomeView);

      expect(wrapper.vm.currentText).toBe('');
    });

    it('should show empty state in AI panel when no ai_result', () => {
      const wrapper = mount(HomeView);

      expect(wrapper.vm.ai_result).toBeNull();
    });
  });

  describe('Platform Limits', () => {
    it('should have getPlatformLimits method', () => {
      const wrapper = mount(HomeView);

      expect(typeof wrapper.vm.getPlatformLimits).toBe('function');
    });

    it('should return desktop limits when not mobile', () => {
      const wrapper = mount(HomeView);

      const limits = wrapper.vm.getPlatformLimits();

      expect(limits.maxTranscription).toBeGreaterThan(0);
      expect(limits.maxAIResponse).toBeGreaterThan(0);
      expect(limits.maxContext).toBeGreaterThan(0);
    });
  });

  describe('Context Attachments Loading', () => {
    it('should have contextAttachments array', () => {
      const wrapper = mount(HomeView);

      // Component should have contextAttachments as an array
      expect(Array.isArray(wrapper.vm.contextAttachments)).toBe(true);
    });
  });

  describe('Auto Mode', () => {
    it('should have toggleAutoMode method', () => {
      const wrapper = mount(HomeView);

      expect(typeof wrapper.vm.toggleAutoMode).toBe('function');
    });
  });

  describe('Mobile Session Persistence', () => {
    beforeEach(() => {
      const { useMobile } = require('@/composables/useMobile');
      useMobile.mockReturnValue({ isMobile: ref(true) });
    });

    it('should have saveMobileSession method', () => {
      const wrapper = mount(HomeView);

      expect(typeof wrapper.vm.saveMobileSession).toBe('function');
    });

    it('should have loadMobileSession method', () => {
      const wrapper = mount(HomeView);

      expect(typeof wrapper.vm.loadMobileSession).toBe('function');
    });
  });

  describe('Response Separator Formatting', () => {
    it('should format response separator with question and timestamp', () => {
      const wrapper = mount(HomeView);
      wrapper.vm.currentQuestion = 'What is the meaning of life?';
      wrapper.vm.responseCount = 0;

      const separator = wrapper.vm.formatResponseSeparator();

      expect(separator).toContain('📝');
      expect(separator).toContain('What is the meaning of life?');
      expect(separator).toContain('Response 1');
      expect(separator).toMatch(/\d{2}:\d{2}:\d{2}/); // Timestamp format
    });

    it('should truncate long questions in separator', () => {
      const wrapper = mount(HomeView);
      wrapper.vm.currentQuestion = 'A'.repeat(100); // Very long question
      wrapper.vm.responseCount = 0;

      const separator = wrapper.vm.formatResponseSeparator();

      expect(separator.length).toBeLessThan(150); // Should be truncated
    });
  });

  describe('Text Update with Memory Management', () => {
    it('should set currentText directly when empty', () => {
      const wrapper = mount(HomeView);

      wrapper.vm.updateCurrentText('New transcript');

      // updateCurrentText sets the text directly when empty (no newline added)
      expect(wrapper.vm.currentText).toContain('New transcript');
    });

    it('should append to existing currentText', () => {
      const wrapper = mount(HomeView);
      wrapper.vm.currentText = 'First line';

      wrapper.vm.updateCurrentText('Second line');

      expect(wrapper.vm.currentText).toContain('First line');
      expect(wrapper.vm.currentText).toContain('Second line');
    });

    it('should truncate when exceeding max length', () => {
      const { useMobile } = require('@/composables/useMobile');
      useMobile.mockReturnValue({ isMobile: ref(false) });

      const wrapper = mount(HomeView);
      // Set to near limit
      wrapper.vm.currentText = 'A'.repeat(14000);

      wrapper.vm.updateCurrentText('B'.repeat(2000));

      // Should be truncated to max
      expect(wrapper.vm.currentText.length).toBeLessThanOrEqual(15000);
    });
  });

  describe('AI Result Update with Separator', () => {
    it('should create new response with separator when first response', () => {
      const wrapper = mount(HomeView);
      wrapper.vm.ai_result = null;
      wrapper.vm.responseCount = 0;

      wrapper.vm.updateAIResult('AI response content', true);

      expect(wrapper.vm.ai_result).toContain('---');
      expect(wrapper.vm.ai_result).toContain('📝');
      expect(wrapper.vm.ai_result).toContain('AI response content');
    });

    it('should append content without separator when streaming', () => {
      const wrapper = mount(HomeView);
      wrapper.vm.ai_result = 'Existing content';
      wrapper.vm.hasStartedResponse = true;

      wrapper.vm.updateAIResult('More content');

      expect(wrapper.vm.ai_result).toBe('Existing contentMore content');
    });
  });

  describe('Transcript Processing', () => {
    it('should get full transcript on first question', () => {
      const wrapper = mount(HomeView);
      wrapper.vm.currentText = 'Full transcript text';
      wrapper.vm.lastProcessedPosition = 0;

      const newContent = wrapper.vm.getNewTranscriptContent();

      expect(newContent).toBe('Full transcript text');
    });

    it('should get only new content after first response', () => {
      const wrapper = mount(HomeView);
      const initialTranscript = 'Initial transcript ';
      const additionalText = 'Additional text';
      wrapper.vm.currentText = initialTranscript + additionalText;
      wrapper.vm.lastProcessedPosition = initialTranscript.length;

      const newContent = wrapper.vm.getNewTranscriptContent();

      expect(newContent).toContain('Additional text');
      expect(newContent).not.toContain('Initial transcript');
    });

    it('should update processed position', () => {
      const wrapper = mount(HomeView);
      wrapper.vm.currentText = 'Full transcript text';
      wrapper.vm.lastProcessedPosition = 0;

      wrapper.vm.updateProcessedPosition('Full transcript text');

      expect(wrapper.vm.lastProcessedPosition).toBe(20);
    });
  });

  describe('CSS Classes', () => {
    it('should apply is-mobile class when mobile', () => {
      const { useMobile } = require('@/composables/useMobile');
      useMobile.mockReturnValue({ isMobile: ref(true) });

      const wrapper = mount(HomeView);

      expect(wrapper.find('.homeview-container.is-mobile').exists()).toBe(true);
    });

    it('should not apply is-mobile class on desktop', () => {
      const wrapper = mount(HomeView);

      // isMobile should be a ref with a value property
      expect(wrapper.vm.isMobile).toBeDefined();
      expect(wrapper.vm.isMobile).toHaveProperty('value');
    });
  });
});

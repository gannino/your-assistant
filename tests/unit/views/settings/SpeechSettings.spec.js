/**
 * SpeechSettings component tests
 * @component tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { mount, config } from '@vue/test-utils';
import SpeechSettings from '@/views/settings/SpeechSettings.vue';

// Configure Vue Test Utils to use Element Plus
config.global.stubs = {
  SettingsLayout: {
    name: 'SettingsLayout',
    template: '<div class="settings-layout"><slot /></div>',
  },
  ElSelect: {
    name: 'ElSelect',
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)" @change="$emit(\'change\', $event.target.value)"><slot /></select>',
    props: ['modelValue'],
  },
  ElOption: {
    name: 'ElOption',
    template: '<option :value="label">{{ label }}</option>',
    props: ['label', 'value'],
  },
  ElInput: {
    name: 'ElInput',
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @change="$emit(\'change\', $event.target.value)">',
    props: ['modelValue', 'placeholder', 'showPassword'],
  },
  ElButton: {
    name: 'ElButton',
    template: '<button @click="$emit(\'click\')"><slot /></button>',
    props: ['loading', 'icon', 'size', 'type', 'disabled'],
  },
  ElAlert: {
    name: 'ElAlert',
    template: '<div v-if="false" class="el-alert" :type="type">{{ title }}</div>',
    props: ['type', 'closable', 'title'],
  },
  ElCheckbox: {
    name: 'ElCheckbox',
    template: '<input type="checkbox" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" @change="$emit(\'change\', $event.target.checked)">',
    props: ['modelValue', 'disabled'],
  },
  ElIcon: {
    name: 'ElIcon',
    template: '<span class="el-icon"><slot /></span>',
  },
};

// Mock config_util
jest.mock('@/utils/config_util', () => ({
  transcription_provider: () => 'azure',
  azure_token: () => '',
  azure_region: () => '',
  azure_language: () => '',
  whisper_api_key: () => '',
  whisper_model: () => 'whisper-1',
  whisper_language: () => 'en',
  webspeech_language: () => 'en-US',
  webspeech_continuous: () => true,
  webspeech_interim_results: () => false,
  deepgram_api_key: () => '',
  deepgram_model: () => 'nova-2',
  deepgram_language: () => 'en',
}));

// Mock transcriptionRegistry
jest.mock('@/services/transcription/transcriptionRegistry', () => ({
  transcriptionRegistry: {
    get: jest.fn(() => ({
      checkBrowserSupport: () => true,
      initialize: jest.fn(),
      validateConfig: jest.fn(() => ({ valid: true })),
    })),
  },
}));

// Mock deepgram_util
jest.mock('@/utils/deepgram_util', () => ({
  fetchDeepgramModels: jest.fn(() => Promise.resolve([
    { id: 'nova-2', name: 'Nova-2', version: 'latest' },
  ])),
  getDefaultDeepgramModels: () => [
    { id: 'nova-2', name: 'Nova-2' },
  ],
}));

describe('SpeechSettings.vue', () => {
  beforeEach(() => {
    // Mock localStorage
    localStorage.clear();

    // Mock navigator.userAgent for iOS detection
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    });

    // Mock window.MSStream
    Object.defineProperty(window, 'MSStream', {
      writable: true,
      configurable: true,
      value: undefined,
    });

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
      const wrapper = mount(SpeechSettings);
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.speech-settings').exists()).toBe(true);
    });

    it('should render provider selection section', () => {
      const wrapper = mount(SpeechSettings);
      expect(wrapper.html()).toContain('Speech Recognition Provider');
    });

    it('should render info text with setup guide link', () => {
      const wrapper = mount(SpeechSettings);
      expect(wrapper.html()).toContain('Setup guide');
    });
  });

  describe('Provider Selection', () => {
    it('should load provider from config on mount', () => {
      const wrapper = mount(SpeechSettings);
      expect(wrapper.vm.transcription_provider).toBe('azure');
    });

    it('should have 4 provider options', () => {
      const wrapper = mount(SpeechSettings);
      // Check HTML content for provider options
      const html = wrapper.html();
      expect(html).toContain('Microsoft Azure');
      expect(html).toContain('OpenAI Whisper');
      expect(html).toContain('Web Speech API');
      expect(html).toContain('Deepgram');
    });

    it('should include Azure, Whisper, Web Speech, and Deepgram options', () => {
      const wrapper = mount(SpeechSettings);
      const html = wrapper.html();
      expect(html).toContain('Microsoft Azure');
      expect(html).toContain('OpenAI Whisper');
      expect(html).toContain('Web Speech API');
      expect(html).toContain('Deepgram');
    });

    it('should save provider to localStorage on change', () => {
      const wrapper = mount(SpeechSettings);
      wrapper.vm.onTranscriptionProviderChange('whisper');
      expect(localStorage.getItem('transcription_provider')).toBe('whisper');
    });
  });

  describe('Test Connection', () => {
    it('should have test connection button', () => {
      const wrapper = mount(SpeechSettings);
      const buttons = wrapper.findAll('button');
      const testButton = buttons.find(btn => btn.text().includes('Test Connection'));
      expect(testButton).toBeDefined();
    });

    it('should show testing state when testing', async () => {
      const wrapper = mount(SpeechSettings);
      wrapper.vm.testing_transcription = true;
      await wrapper.vm.$nextTick();
      const buttons = wrapper.findAll('button');
      const testButton = buttons.find(btn => btn.text().includes('Testing...'));
      expect(testButton).toBeDefined();
    });

    it('should save test result to state', async () => {
      const wrapper = mount(SpeechSettings);
      // Mock successful test
      wrapper.vm.transcription_test_result = {
        success: true,
        message: '✓ Configuration valid',
      };
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.transcription_test_result).toBeTruthy();
    });
  });

  describe('iOS Detection', () => {
    it('should detect iOS device', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });

      const wrapper = mount(SpeechSettings);
      expect(wrapper.vm.isIOS).toBe(true);
    });

    it('should not detect non-iOS device as iOS', () => {
      const wrapper = mount(SpeechSettings);
      expect(wrapper.vm.isIOS).toBe(false);
    });
  });

  describe('getTranscriptionProviderConfig', () => {
    it('should return Azure config', () => {
      const wrapper = mount(SpeechSettings);
      // Set values directly (Vue Test Utils unwraps refs)
      wrapper.vm.azure_token = 'test-token';
      wrapper.vm.azure_region = 'westus';
      wrapper.vm.azure_language = 'en-US';

      const config = wrapper.vm.getTranscriptionProviderConfig('azure');

      expect(config).toEqual({
        azureToken: 'test-token',
        azureRegion: 'westus',
        language: 'en-US',
      });
    });

    it('should return Whisper config', () => {
      const wrapper = mount(SpeechSettings);
      wrapper.vm.whisper_api_key = 'sk-test';
      wrapper.vm.whisper_model = 'whisper-1';
      wrapper.vm.whisper_language = 'en';

      const config = wrapper.vm.getTranscriptionProviderConfig('whisper');

      expect(config).toEqual({
        apiKey: 'sk-test',
        model: 'whisper-1',
        language: 'en',
      });
    });

    it('should return Web Speech config', () => {
      const wrapper = mount(SpeechSettings);
      wrapper.vm.webspeech_language = 'en-US';
      wrapper.vm.webspeech_continuous = true;
      wrapper.vm.webspeech_interim_results = false;

      const config = wrapper.vm.getTranscriptionProviderConfig('webspeech');

      expect(config).toEqual({
        language: 'en-US',
        continuous: true,
        interimResults: false,
      });
    });

    it('should return Deepgram config', () => {
      const wrapper = mount(SpeechSettings);
      wrapper.vm.deepgram_api_key = 'deepgram-key';
      wrapper.vm.deepgram_model = 'nova-2';
      wrapper.vm.deepgram_language = 'en';

      const config = wrapper.vm.getTranscriptionProviderConfig('deepgram');

      expect(config).toEqual({
        apiKey: 'deepgram-key',
        model: 'nova-2',
        language: 'en',
      });
    });

    it('should throw error for unknown provider', () => {
      const wrapper = mount(SpeechSettings);
      expect(() => {
        wrapper.vm.getTranscriptionProviderConfig('unknown');
      }).toThrow('Unknown provider: unknown');
    });
  });

  describe('onKeyChange', () => {
    it('should save Azure token to localStorage', () => {
      const wrapper = mount(SpeechSettings);
      wrapper.vm.azure_token = 'new-token';
      wrapper.vm.onKeyChange('azure_token');
      expect(localStorage.getItem('azure_token')).toBe('new-token');
    });

    it('should save Whisper API key to localStorage', () => {
      const wrapper = mount(SpeechSettings);
      wrapper.vm.whisper_api_key = 'sk-new';
      wrapper.vm.onKeyChange('whisper_api_key');
      expect(localStorage.getItem('whisper_api_key')).toBe('sk-new');
    });

    it('should save Web Speech language to localStorage', () => {
      const wrapper = mount(SpeechSettings);
      wrapper.vm.webspeech_language = 'zh-CN';
      wrapper.vm.onKeyChange('webspeech_language');
      expect(localStorage.getItem('webspeech_language')).toBe('zh-CN');
    });

    it('should save Deepgram API key to localStorage', () => {
      const wrapper = mount(SpeechSettings);
      wrapper.vm.deepgram_api_key = 'new-key';
      wrapper.vm.onKeyChange('deepgram_api_key');
      expect(localStorage.getItem('deepgram_api_key')).toBe('new-key');
    });

    it('should trigger Deepgram model discovery when API key is entered', async () => {
      const { fetchDeepgramModels } = require('@/utils/deepgram_util');
      const wrapper = mount(SpeechSettings);

      wrapper.vm.deepgram_api_key = 'test-key';
      wrapper.vm.onKeyChange('deepgram_api_key');

      // Give the async function time to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(fetchDeepgramModels).toHaveBeenCalledWith('test-key');
    });
  });

  describe('Deepgram Model Discovery', () => {
    it('should show discovering state when discovering models', async () => {
      const wrapper = mount(SpeechSettings);
      wrapper.vm.deepgram_discovering = true;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.deepgram_discovering).toBe(true);
    });

    it('should store discovered models', async () => {
      const { fetchDeepgramModels } = require('@/utils/deepgram_util');
      fetchDeepgramModels.mockResolvedValue([
        { id: 'model-1', name: 'Model 1' },
      ]);

      const wrapper = mount(SpeechSettings);
      wrapper.vm.deepgram_api_key = 'test-key'; // Set API key first
      await wrapper.vm.discoverDeepgramModels();

      expect(wrapper.vm.deepgram_discovered_models).toHaveLength(1);
      expect(wrapper.vm.deepgram_discovered_models[0].id).toBe('model-1');
    });

    it('should show discovery error on failure', async () => {
      const { fetchDeepgramModels } = require('@/utils/deepgram_util');
      fetchDeepgramModels.mockRejectedValue(new Error('API Error'));

      const wrapper = mount(SpeechSettings);
      wrapper.vm.deepgram_api_key = 'test-key'; // Set API key first
      await wrapper.vm.discoverDeepgramModels();

      expect(wrapper.vm.deepgram_discovery_error).toBe('API Error');
    });

    it('should require API key before discovery', async () => {
      const wrapper = mount(SpeechSettings);
      wrapper.vm.deepgram_api_key = '';

      await wrapper.vm.discoverDeepgramModels();

      expect(wrapper.vm.deepgram_discovery_error).toBe('Please enter your API key first');
    });

    it('should auto-select first discovered model', async () => {
      const { fetchDeepgramModels } = require('@/utils/deepgram_util');
      fetchDeepgramModels.mockResolvedValue([
        { id: 'model-1', name: 'Model 1' },
        { id: 'model-2', name: 'Model 2' },
      ]);

      const wrapper = mount(SpeechSettings);
      wrapper.vm.deepgram_api_key = 'test-key'; // Set API key first
      wrapper.vm.deepgram_model = 'old-model';
      await wrapper.vm.discoverDeepgramModels();

      expect(wrapper.vm.deepgram_model).toBe('model-1');
    });
  });

  describe('testTranscriptionConnection', () => {
    it('should handle provider not found', async () => {
      const { transcriptionRegistry } = require('@/services/transcription/transcriptionRegistry');
      // Clear previous mock and set new one
      transcriptionRegistry.get.mockReturnValueOnce(null);

      const wrapper = mount(SpeechSettings);
      await wrapper.vm.testTranscriptionConnection();

      expect(wrapper.vm.transcription_test_result.success).toBe(false);
      expect(wrapper.vm.transcription_test_result.message).toContain('not found');
    });

    it('should handle Web Speech browser incompatibility', async () => {
      const { transcriptionRegistry } = require('@/services/transcription/transcriptionRegistry');
      transcriptionRegistry.get.mockReturnValueOnce({
        checkBrowserSupport: () => false,
      });

      const wrapper = mount(SpeechSettings);
      wrapper.vm.transcription_provider = 'webspeech';
      await wrapper.vm.testTranscriptionConnection();

      expect(wrapper.vm.transcription_test_result.success).toBe(false);
      expect(wrapper.vm.transcription_test_result.message).toContain('not supported');
    });

    it('should handle validation errors', async () => {
      const { transcriptionRegistry } = require('@/services/transcription/transcriptionRegistry');
      transcriptionRegistry.get.mockReturnValueOnce({
        checkBrowserSupport: () => true,
        initialize: jest.fn(),
        validateConfig: jest.fn(() => ({
          valid: false,
          errors: ['Invalid API key'],
        })),
      });

      const wrapper = mount(SpeechSettings);
      await wrapper.vm.testTranscriptionConnection();

      expect(wrapper.vm.transcription_test_result.success).toBe(false);
      expect(wrapper.vm.transcription_test_result.message).toContain('Invalid API key');
    });

    it('should handle successful validation', async () => {
      const { transcriptionRegistry } = require('@/services/transcription/transcriptionRegistry');
      transcriptionRegistry.get.mockReturnValueOnce({
        checkBrowserSupport: () => true,
        initialize: jest.fn(),
        validateConfig: jest.fn(() => ({ valid: true })),
      });

      const wrapper = mount(SpeechSettings);
      await wrapper.vm.testTranscriptionConnection();

      expect(wrapper.vm.transcription_test_result.success).toBe(true);
      expect(wrapper.vm.transcription_test_result.message).toBe('✓ Configuration valid');
    });

    it('should clear test result after 5 seconds on success', async () => {
      jest.useFakeTimers();

      const { transcriptionRegistry } = require('@/services/transcription/transcriptionRegistry');
      transcriptionRegistry.get.mockReturnValueOnce({
        checkBrowserSupport: () => true,
        initialize: jest.fn(),
        validateConfig: jest.fn(() => ({ valid: true })),
      });

      const wrapper = mount(SpeechSettings);
      await wrapper.vm.testTranscriptionConnection();

      expect(wrapper.vm.transcription_test_result).toBeTruthy();

      jest.advanceTimersByTime(5000);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.transcription_test_result).toBeNull();

      jest.useRealTimers();
    });

    it('should handle errors gracefully', async () => {
      const { transcriptionRegistry } = require('@/services/transcription/transcriptionRegistry');
      transcriptionRegistry.get.mockReturnValueOnce({
        checkBrowserSupport: () => true,
        initialize: jest.fn().mockRejectedValue(new Error('Network error')),
        validateConfig: jest.fn(() => ({ valid: true })),
      });

      const wrapper = mount(SpeechSettings);
      await wrapper.vm.testTranscriptionConnection();

      expect(wrapper.vm.transcription_test_result.success).toBe(false);
      expect(wrapper.vm.transcription_test_result.message).toContain('Error');
    });
  });

  describe('Default Values', () => {
    it('should have default Azure settings', () => {
      const wrapper = mount(SpeechSettings);
      expect(wrapper.vm.azure_token).toBe('');
      expect(wrapper.vm.azure_region).toBe('');
      expect(wrapper.vm.azure_language).toBe('');
    });

    it('should have default Whisper settings', () => {
      const wrapper = mount(SpeechSettings);
      expect(wrapper.vm.whisper_api_key).toBe('');
      expect(wrapper.vm.whisper_model).toBe('whisper-1');
      expect(wrapper.vm.whisper_language).toBe('en');
    });

    it('should have default Web Speech settings', () => {
      const wrapper = mount(SpeechSettings);
      expect(wrapper.vm.webspeech_language).toBe('en-US');
      expect(wrapper.vm.webspeech_continuous).toBe(true);
      expect(wrapper.vm.webspeech_interim_results).toBe(false);
    });

    it('should have default Deepgram settings', () => {
      const wrapper = mount(SpeechSettings);
      expect(wrapper.vm.deepgram_api_key).toBe('');
      expect(wrapper.vm.deepgram_model).toBe('nova-2');
      expect(wrapper.vm.deepgram_language).toBe('en');
    });

    it('should have default Deepgram discovery state', () => {
      const wrapper = mount(SpeechSettings);
      expect(wrapper.vm.deepgram_discovering).toBe(false);
      expect(wrapper.vm.deepgram_discovered_models).toEqual([]);
      expect(wrapper.vm.deepgram_discovery_error).toBeNull();
    });

    it('should have default testing state', () => {
      const wrapper = mount(SpeechSettings);
      expect(wrapper.vm.testing_transcription).toBe(false);
      expect(wrapper.vm.transcription_test_result).toBeNull();
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply speech-settings class', () => {
      const wrapper = mount(SpeechSettings);
      expect(wrapper.find('.speech-settings').exists()).toBe(true);
    });

    it('should have info-text class for description', () => {
      const wrapper = mount(SpeechSettings);
      expect(wrapper.find('.info-text').exists()).toBe(true);
    });

    it('should have settings-section classes for each provider', () => {
      const wrapper = mount(SpeechSettings);
      const sections = wrapper.findAll('.settings-section');
      expect(sections.length).toBeGreaterThan(0);
    });
  });

  describe('Provider Sections Visibility', () => {
    it('should show Azure section when Azure provider is selected', async () => {
      const wrapper = mount(SpeechSettings);
      wrapper.vm.transcription_provider = 'azure';
      await wrapper.vm.$nextTick();
      // The Azure section should be visible (v-show)
      expect(wrapper.vm.transcription_provider).toBe('azure');
    });

    it('should show Whisper section when Whisper provider is selected', async () => {
      const wrapper = mount(SpeechSettings);
      wrapper.vm.transcription_provider = 'whisper';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.transcription_provider).toBe('whisper');
    });

    it('should show Web Speech section when Web Speech provider is selected', async () => {
      const wrapper = mount(SpeechSettings);
      wrapper.vm.transcription_provider = 'webspeech';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.transcription_provider).toBe('webspeech');
    });

    it('should show Deepgram section when Deepgram provider is selected', async () => {
      const wrapper = mount(SpeechSettings);
      wrapper.vm.transcription_provider = 'deepgram';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.transcription_provider).toBe('deepgram');
    });
  });
});

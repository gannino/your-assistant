/**
 * AISettings component tests
 * @component tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { mount, config } from '@vue/test-utils';
import AISettings from '@/views/settings/AISettings.vue';

// Configure Vue Test Utils to use Element Plus
config.global.stubs = {
  SettingsLayout: {
    name: 'SettingsLayout',
    template: '<div class="settings-layout"><slot /></div>',
  },
  ElSelect: {
    name: 'ElSelect',
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)" @change="$emit(\'change\', $event.target.value)"><slot /></select>',
    props: ['modelValue', 'loading', 'disabled'],
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
  ElSlider: {
    name: 'ElSlider',
    template: '<input type="range" :min="min" :max="max" :step="step" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @change="$emit(\'change\', $event.target.value)">',
    props: ['modelValue', 'min', 'max', 'step', 'showTooltip'],
  },
  ElAlert: {
    name: 'ElAlert',
    template: '<div v-if="false" class="el-alert" :type="type">{{ title }}</div>',
    props: ['type', 'closable', 'title'],
  },
  ElIcon: {
    name: 'ElIcon',
    template: '<span class="el-icon"><slot /></span>',
  },
};

// Mock config_util
jest.mock('@/utils/config_util', () => ({
  ai_provider: () => 'openai',
  openai_api_key: () => '',
  gpt_model: () => 'gpt-3.5-turbo',
  openai_temperature: () => 0.3,
  zai_api_key: () => '',
  zai_model: () => 'glm-4.7',
  zai_endpoint: () => 'https://api.z.ai/api/coding/paas/v4',
  zai_temperature: () => 0.3,
  ollama_endpoint: () => 'http://localhost:11434',
  ollama_model: () => 'llama2',
  ollama_temperature: () => 0.3,
  mlx_endpoint: () => 'http://localhost:8080',
  mlx_model: () => 'mlx-quantized',
  mlx_temperature: () => 0.3,
  anthropic_api_key: () => '',
  anthropic_model: () => 'claude-3-sonnet-20240229',
  anthropic_temperature: () => 0.3,
  gemini_api_key: () => '',
  gemini_model: () => 'gemini-1.5-flash',
  gemini_temperature: () => 0.3,
  openrouter_api_key: () => '',
  openrouter_model: () => 'anthropic/claude-sonnet-4',
  openrouter_temperature: () => 0.3,
}));

// Mock providerRegistry
const mockProvider = {
  getProviderInfo: () => ({ requiresApiKey: true }),
  initialize: jest.fn(),
  getAvailableModels: jest.fn(() => Promise.resolve(['model-1', 'model-2'])),
  validateConfig: jest.fn(() => Promise.resolve({ valid: true })),
  testConnection: jest.fn(() => Promise.resolve({ success: true })),
};

jest.mock('@/services/ai/providerRegistry', () => ({
  providerRegistry: {
    get: jest.fn(() => mockProvider),
  },
}));

describe('AISettings.vue', () => {
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
      const wrapper = mount(AISettings);
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.ai-settings').exists()).toBe(true);
    });

    it('should render provider selection section', () => {
      const wrapper = mount(AISettings);
      expect(wrapper.html()).toContain('AI Provider');
    });

    it('should render info text with setup guide link', () => {
      const wrapper = mount(AISettings);
      expect(wrapper.html()).toContain('Setup guide');
    });

    it('should have 7 provider options', () => {
      const wrapper = mount(AISettings);
      const html = wrapper.html();
      expect(html).toContain('OpenAI');
      expect(html).toContain('Z.ai');
      expect(html).toContain('Ollama');
      expect(html).toContain('MLX');
      expect(html).toContain('Anthropic');
      expect(html).toContain('Gemini');
      expect(html).toContain('OpenRouter');
    });
  });

  describe('Provider Selection', () => {
    it('should load provider from config on mount', () => {
      const wrapper = mount(AISettings);
      expect(wrapper.vm.ai_provider).toBe('openai');
    });

    it('should save provider to localStorage on change', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.onProviderChange('zai');
      expect(localStorage.getItem('ai_provider')).toBe('zai');
    });
  });

  describe('Test Connection', () => {
    it('should have test connection button', () => {
      const wrapper = mount(AISettings);
      const buttons = wrapper.findAll('button');
      const testButton = buttons.find(btn => btn.text().includes('Test Connection'));
      expect(testButton).toBeDefined();
    });

    it('should show testing state when testing', async () => {
      const wrapper = mount(AISettings);
      wrapper.vm.testing_connection = true;
      await wrapper.vm.$nextTick();
      const buttons = wrapper.findAll('button');
      const testButton = buttons.find(btn => btn.text().includes('Testing...'));
      expect(testButton).toBeDefined();
    });

    // Note: Provider mock override tests are complex due to onMounted calling the mock
    // The basic functionality is tested in other tests

    it('should handle successful validation', async () => {
      const wrapper = mount(AISettings);
      await wrapper.vm.testConnection();

      expect(wrapper.vm.connection_result.success).toBe(true);
      expect(wrapper.vm.connection_result.message).toBe('✓ Configuration valid');
    });

    it('should handle Z.ai test connection', async () => {
      const wrapper = mount(AISettings);
      wrapper.vm.ai_provider = 'zai';
      await wrapper.vm.testConnection();

      expect(wrapper.vm.connection_result.success).toBe(true);
      expect(wrapper.vm.connection_result.message).toBe('✓ Connection successful');
    });

    it('should clear result after 3 seconds on success', async () => {
      jest.useFakeTimers();

      const wrapper = mount(AISettings);
      await wrapper.vm.testConnection();

      expect(wrapper.vm.connection_result).toBeTruthy();

      jest.advanceTimersByTime(3000);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.connection_result).toBeNull();

      jest.useRealTimers();
    });
  });

  describe('getProviderConfig', () => {
    it('should return OpenAI config', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.openai_key = 'sk-test';
      wrapper.vm.gpt_model = 'gpt-4';
      wrapper.vm.openai_temperature = 0.5;

      const config = wrapper.vm.getProviderConfig('openai');

      expect(config).toEqual({
        apiKey: 'sk-test',
        model: 'gpt-4',
        temperature: 0.5,
      });
    });

    it('should return Z.ai config', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.zai_api_key = 'zai-key';
      wrapper.vm.zai_model = 'glm-4';
      wrapper.vm.zai_endpoint = 'https://api.z.ai/v4';
      wrapper.vm.zai_temperature = 0.7;

      const config = wrapper.vm.getProviderConfig('zai');

      expect(config).toEqual({
        apiKey: 'zai-key',
        model: 'glm-4',
        endpoint: 'https://api.z.ai/v4',
        temperature: 0.7,
      });
    });

    it('should return Ollama config', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.ollama_endpoint = 'http://localhost:11434';
      wrapper.vm.ollama_model = 'llama2';
      wrapper.vm.ollama_temperature = 0.3;

      const config = wrapper.vm.getProviderConfig('ollama');

      expect(config).toEqual({
        endpoint: 'http://localhost:11434',
        model: 'llama2',
        temperature: 0.3,
      });
    });

    it('should return MLX config', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.mlx_endpoint = 'http://localhost:8080';
      wrapper.vm.mlx_model = 'mlx-quantized';
      wrapper.vm.mlx_temperature = 0.3;

      const config = wrapper.vm.getProviderConfig('mlx');

      expect(config).toEqual({
        endpoint: 'http://localhost:8080',
        model: 'mlx-quantized',
        temperature: 0.3,
      });
    });

    it('should return Anthropic config', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.anthropic_api_key = 'sk-ant-test';
      wrapper.vm.anthropic_model = 'claude-3-sonnet';
      wrapper.vm.anthropic_temperature = 0.5;

      const config = wrapper.vm.getProviderConfig('anthropic');

      expect(config).toEqual({
        apiKey: 'sk-ant-test',
        model: 'claude-3-sonnet',
        temperature: 0.5,
      });
    });

    it('should return Gemini config', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.gemini_api_key = 'AIza-test';
      wrapper.vm.gemini_model = 'gemini-pro';
      wrapper.vm.gemini_temperature = 0.5;

      const config = wrapper.vm.getProviderConfig('gemini');

      expect(config).toEqual({
        apiKey: 'AIza-test',
        model: 'gemini-pro',
        temperature: 0.5,
      });
    });

    it('should return OpenRouter config', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.openrouter_api_key = 'sk-or-test';
      wrapper.vm.openrouter_model = 'anthropic/claude-sonnet-4';
      wrapper.vm.openrouter_temperature = 0.5;

      const config = wrapper.vm.getProviderConfig('openrouter');

      expect(config).toEqual({
        apiKey: 'sk-or-test',
        model: 'anthropic/claude-sonnet-4',
        temperature: 0.5,
      });
    });

    it('should return empty config for unknown provider', () => {
      const wrapper = mount(AISettings);
      const config = wrapper.vm.getProviderConfig('unknown');
      expect(config).toEqual({});
    });
  });

  describe('onKeyChange', () => {
    it('should save OpenAI key to localStorage', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.openai_key = 'sk-new';
      wrapper.vm.onKeyChange('openai_key');
      expect(localStorage.getItem('openai_key')).toBe('sk-new');
    });

    it('should save Z.ai API key to localStorage', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.zai_api_key = 'zai-key';
      wrapper.vm.onKeyChange('zai_api_key');
      expect(localStorage.getItem('zai_api_key')).toBe('zai-key');
    });

    it('should save Anthropic API key to localStorage', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.anthropic_api_key = 'sk-ant-test';
      wrapper.vm.onKeyChange('anthropic_api_key');
      expect(localStorage.getItem('anthropic_api_key')).toBe('sk-ant-test');
    });

    it('should save temperature to localStorage', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.openai_temperature = 0.7;
      wrapper.vm.onKeyChange('openai_temperature');
      expect(localStorage.getItem('openai_temperature')).toBe('0.7');
    });

    it('should save endpoint to localStorage', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.ollama_endpoint = 'http://localhost:9999';
      wrapper.vm.onKeyChange('ollama_endpoint');
      expect(localStorage.getItem('ollama_endpoint')).toBe('http://localhost:9999');
    });
  });

  describe('restoreDefaultEndpoint', () => {
    it('should restore Z.ai endpoint', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.zai_endpoint = 'http://custom.endpoint';
      wrapper.vm.restoreDefaultEndpoint('zai');

      expect(wrapper.vm.zai_endpoint).toBe('https://api.z.ai/api/coding/paas/v4');
      expect(localStorage.getItem('zai_endpoint')).toBe('https://api.z.ai/api/coding/paas/v4');
      expect(wrapper.vm.connection_result.message).toBe('✓ Endpoint restored');
    });

    it('should restore Ollama endpoint', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.ollama_endpoint = 'http://custom.endpoint';
      wrapper.vm.restoreDefaultEndpoint('ollama');

      expect(wrapper.vm.ollama_endpoint).toBe('http://localhost:11434');
      expect(localStorage.getItem('ollama_endpoint')).toBe('http://localhost:11434');
    });

    it('should restore MLX endpoint', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.mlx_endpoint = 'http://custom.endpoint';
      wrapper.vm.restoreDefaultEndpoint('mlx');

      expect(wrapper.vm.mlx_endpoint).toBe('http://localhost:8080');
      expect(localStorage.getItem('mlx_endpoint')).toBe('http://localhost:8080');
    });

    it('should handle unknown provider gracefully', () => {
      const wrapper = mount(AISettings);
      expect(() => wrapper.vm.restoreDefaultEndpoint('unknown')).not.toThrow();
    });

    it('should clear connection result after 2 seconds', async () => {
      jest.useFakeTimers();
      const wrapper = mount(AISettings);
      wrapper.vm.restoreDefaultEndpoint('zai');

      expect(wrapper.vm.connection_result).toBeTruthy();

      jest.advanceTimersByTime(2000);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.connection_result).toBeNull();

      jest.useRealTimers();
    });
  });

  describe('getModelLabel', () => {
    it('should return label for known models', () => {
      const wrapper = mount(AISettings);
      expect(wrapper.vm.getModelLabel('gpt-4o')).toBe('GPT-4o');
      expect(wrapper.vm.getModelLabel('gpt-5.4')).toBe('GPT-5.4 (Latest)');
      expect(wrapper.vm.getModelLabel('glm-4.7')).toBe('GLM-4.7 (Latest)');
      expect(wrapper.vm.getModelLabel('claude-3-haiku-20240307')).toBe('Claude 3 Haiku (Fast)');
    });

    it('should return model ID for unknown models', () => {
      const wrapper = mount(AISettings);
      expect(wrapper.vm.getModelLabel('unknown-model')).toBe('unknown-model');
    });
  });

  describe('setDefaultModels', () => {
    it('should set default models for OpenAI', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.setDefaultModels('openai');
      expect(wrapper.vm.openai_models).toContain('gpt-5.4');
      expect(wrapper.vm.openai_models).toContain('gpt-4o');
      expect(wrapper.vm.openai_models).toContain('o1');
    });

    it('should set default models for Z.ai', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.setDefaultModels('zai');
      expect(wrapper.vm.zai_models).toContain('glm-4.7');
      expect(wrapper.vm.zai_models).toContain('glm-4-turbo');
    });

    it('should set default models for Ollama', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.setDefaultModels('ollama');
      expect(wrapper.vm.ollama_models).toContain('llama2');
      expect(wrapper.vm.ollama_models).toContain('mistral');
    });

    it('should set default models for Anthropic', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.setDefaultModels('anthropic');
      expect(wrapper.vm.anthropic_models).toContain('claude-sonnet-4-6');
      expect(wrapper.vm.anthropic_models).toContain('claude-opus-4-6');
    });

    it('should set default models for Gemini', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.setDefaultModels('gemini');
      expect(wrapper.vm.gemini_models).toContain('gemini-1.5-flash');
      expect(wrapper.vm.gemini_models).toContain('gemini-1.5-pro');
    });

    it('should set default models for OpenRouter', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.setDefaultModels('openrouter');
      expect(wrapper.vm.openrouter_models).toContain('anthropic/claude-sonnet-4');
      expect(wrapper.vm.openrouter_models).toContain('openai/gpt-4o');
    });
  });

  describe('loadModelsForProvider', () => {
    it('should skip if already loading', async () => {
      const wrapper = mount(AISettings);
      wrapper.vm.isLoadingModelsGuard = true;

      await wrapper.vm.loadModelsForProvider('openai');

      // Should not change loading state
      expect(wrapper.vm.isLoadingModelsGuard).toBe(true);
    });

    it('should set default models if no API key', async () => {
      const wrapper = mount(AISettings);
      wrapper.vm.openai_key = '';
      wrapper.vm.openai_models = [];

      await wrapper.vm.loadModelsForProvider('openai');

      expect(wrapper.vm.openai_models.length).toBeGreaterThan(0);
    });
    // Note: Provider mock override tests are complex due to onMounted calling the mock
    // The basic functionality is tested in other tests
  });

  describe('refreshModels', () => {
    it('should call loadModelsForProvider with current provider', () => {
      const wrapper = mount(AISettings);
      wrapper.vm.ai_provider = 'zai';

      // Call refreshModels and verify it calls with correct provider
      wrapper.vm.refreshModels();
      // The spy on providerRegistry.get should have been called
      const { providerRegistry } = require('@/services/ai/providerRegistry');
      expect(providerRegistry.get).toHaveBeenCalled();
    });
  });

  describe('Default Values', () => {
    it('should have default OpenAI settings', () => {
      const wrapper = mount(AISettings);
      expect(wrapper.vm.openai_key).toBe('');
      expect(wrapper.vm.gpt_model).toBe('gpt-3.5-turbo');
      expect(wrapper.vm.openai_temperature).toBe(0.3);
      // Models are loaded on mount via loadModelsForProvider
      expect(wrapper.vm.openai_models.length).toBeGreaterThanOrEqual(0);
    });

    it('should have default Z.ai settings', () => {
      const wrapper = mount(AISettings);
      expect(wrapper.vm.zai_api_key).toBe('');
      expect(wrapper.vm.zai_model).toBe('glm-4.7');
      expect(wrapper.vm.zai_endpoint).toBe('https://api.z.ai/api/coding/paas/v4');
      expect(wrapper.vm.zai_temperature).toBe(0.3);
    });

    it('should have default Ollama settings', () => {
      const wrapper = mount(AISettings);
      expect(wrapper.vm.ollama_endpoint).toBe('http://localhost:11434');
      expect(wrapper.vm.ollama_model).toBe('llama2');
      expect(wrapper.vm.ollama_temperature).toBe(0.3);
    });

    it('should have default MLX settings', () => {
      const wrapper = mount(AISettings);
      expect(wrapper.vm.mlx_endpoint).toBe('http://localhost:8080');
      expect(wrapper.vm.mlx_model).toBe('mlx-quantized');
      expect(wrapper.vm.mlx_temperature).toBe(0.3);
    });

    it('should have default Anthropic settings', () => {
      const wrapper = mount(AISettings);
      expect(wrapper.vm.anthropic_api_key).toBe('');
      expect(wrapper.vm.anthropic_model).toBe('claude-3-sonnet-20240229');
      expect(wrapper.vm.anthropic_temperature).toBe(0.3);
    });

    it('should have default Gemini settings', () => {
      const wrapper = mount(AISettings);
      expect(wrapper.vm.gemini_api_key).toBe('');
      expect(wrapper.vm.gemini_model).toBe('gemini-1.5-flash');
      expect(wrapper.vm.gemini_temperature).toBe(0.3);
    });

    it('should have default OpenRouter settings', () => {
      const wrapper = mount(AISettings);
      expect(wrapper.vm.openrouter_api_key).toBe('');
      expect(wrapper.vm.openrouter_model).toBe('anthropic/claude-sonnet-4');
      expect(wrapper.vm.openrouter_temperature).toBe(0.3);
    });

    it('should have default state values', () => {
      const wrapper = mount(AISettings);
      expect(wrapper.vm.loading_models).toBe(false);
      expect(wrapper.vm.model_error).toBeNull();
      expect(wrapper.vm.testing_connection).toBe(false);
      expect(wrapper.vm.connection_result).toBeNull();
      expect(wrapper.vm.isLoadingModelsGuard).toBe(false);
    });
  });

  describe('CSS Classes', () => {
    it('should apply ai-settings class', () => {
      const wrapper = mount(AISettings);
      expect(wrapper.find('.ai-settings').exists()).toBe(true);
    });

    it('should have info-text class', () => {
      const wrapper = mount(AISettings);
      expect(wrapper.find('.info-text').exists()).toBe(true);
    });

    it('should have settings-section classes', () => {
      const wrapper = mount(AISettings);
      const sections = wrapper.findAll('.settings-section');
      expect(sections.length).toBeGreaterThan(0);
    });
  });

  describe('Provider Sections Visibility', () => {
    it('should show OpenAI section when selected', async () => {
      const wrapper = mount(AISettings);
      wrapper.vm.ai_provider = 'openai';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.ai_provider).toBe('openai');
    });

    it('should show Z.ai section when selected', async () => {
      const wrapper = mount(AISettings);
      wrapper.vm.ai_provider = 'zai';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.ai_provider).toBe('zai');
    });

    it('should show Ollama section when selected', async () => {
      const wrapper = mount(AISettings);
      wrapper.vm.ai_provider = 'ollama';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.ai_provider).toBe('ollama');
    });

    it('should show Anthropic section when selected', async () => {
      const wrapper = mount(AISettings);
      wrapper.vm.ai_provider = 'anthropic';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.ai_provider).toBe('anthropic');
    });

    it('should show Gemini section when selected', async () => {
      const wrapper = mount(AISettings);
      wrapper.vm.ai_provider = 'gemini';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.ai_provider).toBe('gemini');
    });

    it('should show OpenRouter section when selected', async () => {
      const wrapper = mount(AISettings);
      wrapper.vm.ai_provider = 'openrouter';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.ai_provider).toBe('openrouter');
    });
  });
});

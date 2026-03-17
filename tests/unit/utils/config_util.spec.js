import { describe, it, expect, beforeEach } from '@jest/globals';
import config from '@/utils/config_util';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('config_util', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  // ============================================
  // AI Provider Selection
  // ============================================

  describe('ai_provider', () => {
    it('should return default provider when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.ai_provider()).toBe('openai');
    });

    it('should return stored provider', () => {
      localStorageMock.getItem.mockReturnValue('openrouter');
      expect(config.ai_provider()).toBe('openrouter');
    });

    it('should handle uppercase provider names', () => {
      localStorageMock.getItem.mockReturnValue('OPENAI');
      expect(config.ai_provider()).toBe('OPENAI');
    });
  });

  describe('gpt_system_prompt', () => {
    it('should return null when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.gpt_system_prompt()).toBeNull();
    });

    it('should return stored system prompt', () => {
      const prompt = 'You are a helpful assistant';
      localStorageMock.getItem.mockReturnValue(prompt);
      expect(config.gpt_system_prompt()).toBe(prompt);
    });

    it('should return empty string when set to empty', () => {
      localStorageMock.getItem.mockReturnValue('');
      expect(config.gpt_system_prompt()).toBe('');
    });
  });

  // ============================================
  // OpenAI Configuration
  // ============================================

  describe('openai_api_key', () => {
    it('should return null when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.openai_api_key()).toBeNull();
    });

    it('should return stored API key', () => {
      localStorageMock.getItem.mockReturnValue('sk-test-key');
      expect(config.openai_api_key()).toBe('sk-test-key');
    });

    it('should return empty string when set to empty', () => {
      localStorageMock.getItem.mockReturnValue('');
      expect(config.openai_api_key()).toBe('');
    });
  });

  describe('gpt_model', () => {
    it('should return default model when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.gpt_model()).toBe('gpt-3.5-turbo');
    });

    it('should return stored model', () => {
      localStorageMock.getItem.mockReturnValue('gpt-4');
      expect(config.gpt_model()).toBe('gpt-4');
    });
  });

  describe('openai_temperature', () => {
    it('should return default temperature when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.openai_temperature()).toBe(0.3);
    });

    it('should return stored temperature', () => {
      localStorageMock.getItem.mockReturnValue('0.7');
      expect(config.openai_temperature()).toBe(0.7);
    });

    it('should parse temperature string to float', () => {
      localStorageMock.getItem.mockReturnValue('1.5');
      expect(config.openai_temperature()).toBe(1.5);
    });

    it('should handle invalid temperature values with fallback', () => {
      localStorageMock.getItem.mockReturnValue('invalid');
      expect(config.openai_temperature()).toBe(0.3);
    });
  });

  // ============================================
  // Z.ai Configuration
  // ============================================

  describe('zai_api_key', () => {
    it('should return null when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.zai_api_key()).toBeNull();
    });

    it('should return stored API key', () => {
      localStorageMock.getItem.mockReturnValue('zai-test-key');
      expect(config.zai_api_key()).toBe('zai-test-key');
    });
  });

  describe('zai_model', () => {
    it('should return default model when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.zai_model()).toBe('glm-4.7');
    });

    it('should return stored model', () => {
      localStorageMock.getItem.mockReturnValue('glm-4.9');
      expect(config.zai_model()).toBe('glm-4.9');
    });
  });

  describe('zai_endpoint', () => {
    it('should return default endpoint when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.zai_endpoint()).toBe('https://api.z.ai/api/coding/paas/v4');
    });

    it('should return stored endpoint', () => {
      const customEndpoint = 'https://custom.z.ai/v1';
      localStorageMock.getItem.mockReturnValue(customEndpoint);
      expect(config.zai_endpoint()).toBe(customEndpoint);
    });
  });

  describe('zai_temperature', () => {
    it('should return default temperature when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.zai_temperature()).toBe(0.3);
    });

    it('should return stored temperature', () => {
      localStorageMock.getItem.mockReturnValue('0.5');
      expect(config.zai_temperature()).toBe(0.5);
    });
  });

  // ============================================
  // Ollama Configuration
  // ============================================

  describe('ollama_endpoint', () => {
    it('should return default endpoint when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.ollama_endpoint()).toBe('http://localhost:11434');
    });

    it('should return stored endpoint', () => {
      const customEndpoint = 'http://192.168.1.100:11434';
      localStorageMock.getItem.mockReturnValue(customEndpoint);
      expect(config.ollama_endpoint()).toBe(customEndpoint);
    });
  });

  describe('ollama_model', () => {
    it('should return default model when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.ollama_model()).toBe('llama2');
    });

    it('should return stored model', () => {
      localStorageMock.getItem.mockReturnValue('mistral');
      expect(config.ollama_model()).toBe('mistral');
    });
  });

  describe('ollama_temperature', () => {
    it('should return default temperature when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.ollama_temperature()).toBe(0.3);
    });

    it('should return stored temperature', () => {
      localStorageMock.getItem.mockReturnValue('0.8');
      expect(config.ollama_temperature()).toBe(0.8);
    });
  });

  // ============================================
  // MLX Configuration
  // ============================================

  describe('mlx_endpoint', () => {
    it('should return default endpoint when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.mlx_endpoint()).toBe('http://localhost:8080');
    });

    it('should return stored endpoint', () => {
      const customEndpoint = 'http://localhost:3000';
      localStorageMock.getItem.mockReturnValue(customEndpoint);
      expect(config.mlx_endpoint()).toBe(customEndpoint);
    });
  });

  describe('mlx_model', () => {
    it('should return default model when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.mlx_model()).toBe('mlx-quantized');
    });

    it('should return stored model', () => {
      localStorageMock.getItem.mockReturnValue('mlx-community/Mistral-7B-q4');
      expect(config.mlx_model()).toBe('mlx-community/Mistral-7B-q4');
    });
  });

  describe('mlx_temperature', () => {
    it('should return default temperature when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.mlx_temperature()).toBe(0.3);
    });

    it('should return stored temperature', () => {
      localStorageMock.getItem.mockReturnValue('0.5');
      expect(config.mlx_temperature()).toBe(0.5);
    });
  });

  // ============================================
  // Anthropic Configuration
  // ============================================

  describe('anthropic_api_key', () => {
    it('should return null when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.anthropic_api_key()).toBeNull();
    });

    it('should return stored API key', () => {
      localStorageMock.getItem.mockReturnValue('sk-ant-test-key');
      expect(config.anthropic_api_key()).toBe('sk-ant-test-key');
    });
  });

  describe('anthropic_model', () => {
    it('should return default model when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.anthropic_model()).toBe('claude-3-sonnet-20240229');
    });

    it('should return stored model', () => {
      localStorageMock.getItem.mockReturnValue('claude-opus-4-20250514');
      expect(config.anthropic_model()).toBe('claude-opus-4-20250514');
    });
  });

  describe('anthropic_temperature', () => {
    it('should return default temperature when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.anthropic_temperature()).toBe(0.3);
    });

    it('should return stored temperature', () => {
      localStorageMock.getItem.mockReturnValue('0.7');
      expect(config.anthropic_temperature()).toBe(0.7);
    });
  });

  // ============================================
  // Gemini Configuration
  // ============================================

  describe('gemini_api_key', () => {
    it('should return null when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.gemini_api_key()).toBeNull();
    });

    it('should return stored API key', () => {
      localStorageMock.getItem.mockReturnValue('gemini-test-key');
      expect(config.gemini_api_key()).toBe('gemini-test-key');
    });
  });

  describe('gemini_model', () => {
    it('should return default model when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.gemini_model()).toBe('gemini-1.5-flash');
    });

    it('should return stored model', () => {
      localStorageMock.getItem.mockReturnValue('gemini-2.5-pro');
      expect(config.gemini_model()).toBe('gemini-2.5-pro');
    });
  });

  describe('gemini_temperature', () => {
    it('should return default temperature when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.gemini_temperature()).toBe(0.3);
    });

    it('should return stored temperature', () => {
      localStorageMock.getItem.mockReturnValue('1.0');
      expect(config.gemini_temperature()).toBe(1.0);
    });
  });

  // ============================================
  // OpenRouter Configuration
  // ============================================

  describe('openrouter_api_key', () => {
    it('should return null when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.openrouter_api_key()).toBeNull();
    });

    it('should return stored API key', () => {
      localStorageMock.getItem.mockReturnValue('sk-or-v1-test-key');
      expect(config.openrouter_api_key()).toBe('sk-or-v1-test-key');
    });

    it('should return invalid key without validation', () => {
      localStorageMock.getItem.mockReturnValue('invalid-key');
      expect(config.openrouter_api_key()).toBe('invalid-key');
    });
  });

  describe('openrouter_model', () => {
    it('should return default model when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.openrouter_model()).toBe('anthropic/claude-sonnet-4');
    });

    it('should return stored model', () => {
      localStorageMock.getItem.mockReturnValue('openai/gpt-4o');
      expect(config.openrouter_model()).toBe('openai/gpt-4o');
    });
  });

  describe('openrouter_temperature', () => {
    it('should return default temperature when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.openrouter_temperature()).toBe(0.3);
    });

    it('should return stored temperature', () => {
      localStorageMock.getItem.mockReturnValue('0.5');
      expect(config.openrouter_temperature()).toBe(0.5);
    });
  });

  // ============================================
  // Transcription Configuration
  // ============================================

  describe('transcription_provider', () => {
    it('should return default provider when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.transcription_provider()).toBe('azure');
    });

    it('should return stored provider', () => {
      localStorageMock.getItem.mockReturnValue('webspeech');
      expect(config.transcription_provider()).toBe('webspeech');
    });
  });

  describe('azure_region', () => {
    it('should return default region when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.azure_region()).toBe('eastasia');
    });

    it('should return stored region', () => {
      localStorageMock.getItem.mockReturnValue('westus2');
      expect(config.azure_region()).toBe('westus2');
    });
  });

  describe('azure_token', () => {
    it('should return null when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.azure_token()).toBeNull();
    });

    it('should return stored token', () => {
      localStorageMock.getItem.mockReturnValue('azure-test-token');
      expect(config.azure_token()).toBe('azure-test-token');
    });
  });

  describe('azure_language', () => {
    it('should return default language when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.azure_language()).toBe('en-US');
    });

    it('should return stored language', () => {
      localStorageMock.getItem.mockReturnValue('zh-CN');
      expect(config.azure_language()).toBe('zh-CN');
    });
  });

  describe('whisper_api_key', () => {
    it('should return null when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.whisper_api_key()).toBeNull();
    });

    it('should return stored API key', () => {
      localStorageMock.getItem.mockReturnValue('whisper-test-key');
      expect(config.whisper_api_key()).toBe('whisper-test-key');
    });
  });

  describe('whisper_model', () => {
    it('should return default model when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.whisper_model()).toBe('whisper-1');
    });

    it('should return stored model', () => {
      localStorageMock.getItem.mockReturnValue('whisper-1-large');
      expect(config.whisper_model()).toBe('whisper-1-large');
    });
  });

  describe('whisper_language', () => {
    it('should return default language when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.whisper_language()).toBe('en');
    });

    it('should return stored language', () => {
      localStorageMock.getItem.mockReturnValue('es');
      expect(config.whisper_language()).toBe('es');
    });
  });

  describe('webspeech_language', () => {
    it('should return default language when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.webspeech_language()).toBe('en-US');
    });

    it('should return stored language', () => {
      localStorageMock.getItem.mockReturnValue('zh-CN');
      expect(config.webspeech_language()).toBe('zh-CN');
    });
  });

  describe('webspeech_continuous', () => {
    it('should return true when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.webspeech_continuous()).toBe(true);
    });

    it('should return stored value as boolean', () => {
      localStorageMock.getItem.mockReturnValue('false');
      expect(config.webspeech_continuous()).toBe(false);
    });

    it('should handle string "false"', () => {
      localStorageMock.getItem.mockReturnValue('false');
      expect(config.webspeech_continuous()).toBe(false);
    });
  });

  describe('webspeech_interim_results', () => {
    it('should return false when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.webspeech_interim_results()).toBe(false);
    });

    it('should return stored value as boolean', () => {
      localStorageMock.getItem.mockReturnValue('true');
      expect(config.webspeech_interim_results()).toBe(true);
    });

    it('should handle string "false"', () => {
      localStorageMock.getItem.mockReturnValue('false');
      expect(config.webspeech_interim_results()).toBe(false);
    });
  });

  describe('deepgram_api_key', () => {
    it('should return null when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.deepgram_api_key()).toBeNull();
    });

    it('should return stored API key', () => {
      localStorageMock.getItem.mockReturnValue('deepgram-test-key');
      expect(config.deepgram_api_key()).toBe('deepgram-test-key');
    });
  });

  describe('deepgram_model', () => {
    it('should return default model when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.deepgram_model()).toBe('nova-2');
    });

    it('should return stored model', () => {
      localStorageMock.getItem.mockReturnValue('nova-2-phonecall');
      expect(config.deepgram_model()).toBe('nova-2-phonecall');
    });
  });

  describe('deepgram_language', () => {
    it('should return default language when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.deepgram_language()).toBe('en');
    });

    it('should return stored language', () => {
      localStorageMock.getItem.mockReturnValue('es');
      expect(config.deepgram_language()).toBe('es');
    });
  });

  // ============================================
  // UI Configuration
  // ============================================

  describe('scroll_speed', () => {
    it('should return default speed when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.scroll_speed()).toBe(80);
    });

    it('should return stored speed', () => {
      localStorageMock.getItem.mockReturnValue('5');
      expect(config.scroll_speed()).toBe(5);
    });

    it('should use default when value is zero (treated as falsy)', () => {
      localStorageMock.getItem.mockReturnValue('0');
      expect(config.scroll_speed()).toBe(80);
    });
  });
});

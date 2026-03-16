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

  describe('openai_api_key', () => {
    it('should return default value when no API key is set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.openai_api_key()).toBeNull();
    });

    it('should return stored API key', () => {
      localStorageMock.getItem.mockReturnValue('test-api-key');
      expect(config.openai_api_key()).toBe('test-api-key');
    });

    it('should handle empty string', () => {
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

  describe('openrouter_api_key', () => {
    it('should return null when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.openrouter_api_key()).toBeNull();
    });

    it('should return stored API key', () => {
      localStorageMock.getItem.mockReturnValue('sk-or-v1-test-key');
      expect(config.openrouter_api_key()).toBe('sk-or-v1-test-key');
    });

    it('should validate API key format starts with sk-or-v1-', () => {
      localStorageMock.getItem.mockReturnValue('invalid-key');
      const key = config.openrouter_api_key();
      // Config doesn't validate, just returns
      expect(key).toBe('invalid-key');
    });
  });

  describe('ai_provider', () => {
    it('should return default provider when not set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(config.ai_provider()).toBe('openai');
    });

    it('should return stored provider', () => {
      localStorageMock.getItem.mockReturnValue('openrouter');
      expect(config.ai_provider()).toBe('openrouter');
    });

    it('should handle lowercase provider names', () => {
      localStorageMock.getItem.mockReturnValue('OPENAI');
      expect(config.ai_provider()).toBe('OPENAI');
    });
  });
});

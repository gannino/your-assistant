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
});

/**
 * Deepgram utility tests
 * @utility tests
 */

import {
  fetchDeepgramModels,
  getDefaultDeepgramModels,
} from '@/utils/deepgram_util';

describe('deepgram_util', () => {
  beforeEach(() => {
    // Mock fetch globally
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchDeepgramModels', () => {
    it('should throw error when API key is not provided', async () => {
      await expect(fetchDeepgramModels('')).rejects.toThrow('API key is required');
      await expect(fetchDeepgramModels(null)).rejects.toThrow('API key is required');
      await expect(fetchDeepgramModels(undefined)).rejects.toThrow('API key is required');
    });

    it('should fetch models successfully from Deepgram API', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          stt: [
            {
              name: 'nova-2',
              version: '2.5.0',
              tier: 'enhanced',
              language: 'en',
            },
            {
              name: 'nova-3',
              version: '3.0.0',
              tier: 'base',
              language: 'en',
            },
          ],
        }),
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await fetchDeepgramModels('test-api-key');

      expect(global.fetch).toHaveBeenCalledWith('https://api.deepgram.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: 'Token test-api-key',
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual([
        {
          id: 'nova-2',
          name: 'nova-2',
          version: '2.5.0',
          tier: 'enhanced',
          language: 'en',
        },
        {
          id: 'nova-3',
          name: 'nova-3',
          version: '3.0.0',
          tier: 'base',
          language: 'en',
        },
      ]);
    });

    it('should handle empty STT models array', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          stt: [],
        }),
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await fetchDeepgramModels('test-api-key');

      expect(result).toEqual([]);
    });

    it('should handle missing STT field in response', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({}),
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await fetchDeepgramModels('test-api-key');

      expect(result).toEqual([]);
    });

    it('should throw error on 401 unauthorized', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      await expect(fetchDeepgramModels('invalid-key')).rejects.toThrow('Invalid API key');
    });

    it('should throw error on other HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      await expect(fetchDeepgramModels('test-api-key')).rejects.toThrow(
        'Failed to fetch models: 500 Internal Server Error'
      );
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      global.fetch.mockRejectedValueOnce(networkError);

      await expect(fetchDeepgramModels('test-api-key')).rejects.toThrow('Network error');
    });

    it('should handle malformed JSON response', async () => {
      const mockResponse = {
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      await expect(fetchDeepgramModels('test-api-key')).rejects.toThrow('Invalid JSON');
    });

    it('should handle models without version field', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          stt: [
            {
              name: 'base-model',
              tier: 'base',
              language: 'en',
            },
          ],
        }),
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await fetchDeepgramModels('test-api-key');

      expect(result[0].version).toBe('latest');
    });

    it('should handle models without tier field', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          stt: [
            {
              name: 'basic-model',
              language: 'en',
            },
          ],
        }),
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await fetchDeepgramModels('test-api-key');

      expect(result[0].tier).toBe('base');
    });

    it('should handle models without language field', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          stt: [
            {
              name: 'multi-lingual',
              version: '1.0',
            },
          ],
        }),
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await fetchDeepgramModels('test-api-key');

      expect(result[0].language).toBe('en');
    });

    it('should format model data correctly', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          stt: [
            {
              name: 'whisper-tiny',
              version: '1.0.0',
              tier: 'base',
              language: 'en',
            },
          ],
        }),
      };

      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await fetchDeepgramModels('test-api-key');

      expect(result[0]).toHaveProperty('id', 'whisper-tiny');
      expect(result[0]).toHaveProperty('name', 'whisper-tiny');
      expect(result[0]).toHaveProperty('version', '1.0.0');
      expect(result[0]).toHaveProperty('tier', 'base');
      expect(result[0]).toHaveProperty('language', 'en');
    });
  });

  describe('getDefaultDeepgramModels', () => {
    it('should return array of default models', () => {
      const defaults = getDefaultDeepgramModels();

      expect(Array.isArray(defaults)).toBe(true);
      expect(defaults.length).toBeGreaterThan(0);
    });

    it('should include expected default models', () => {
      const defaults = getDefaultDeepgramModels();
      const modelIds = defaults.map(m => m.id);

      expect(modelIds).toContain('nova-2');
      expect(modelIds).toContain('nova-3');
      expect(modelIds).toContain('nova');
      expect(modelIds).toContain('enhanced');
      expect(modelIds).toContain('base');
    });

    it('should have correct structure for each model', () => {
      const defaults = getDefaultDeepgramModels();

      defaults.forEach(model => {
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('name');
        expect(typeof model.id).toBe('string');
        expect(typeof model.name).toBe('string');
      });
    });

    it('should include descriptive names', () => {
      const defaults = getDefaultDeepgramModels();

      const nova2 = defaults.find(m => m.id === 'nova-2');
      expect(nova2.name).toContain('Recommended');

      const nova3 = defaults.find(m => m.id === 'nova-3');
      expect(nova3.name).toContain('Latest');
    });

    it('should have exactly 5 default models', () => {
      const defaults = getDefaultDeepgramModels();

      expect(defaults.length).toBe(5);
    });
  });
});

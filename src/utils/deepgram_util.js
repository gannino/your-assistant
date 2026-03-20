/**
 * Deepgram API utilities
 * Fetch available models from Deepgram API
 */

/**
 * Fetch available Deepgram models from the API
 * @param {string} apiKey - Deepgram API key
 * @returns {Promise<Array<{id: string, name: string, version: string, tier: string}>>}
 */
export async function fetchDeepgramModels(apiKey) {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  try {
    const response = await fetch('https://api.deepgram.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key');
      }
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract STT models
    const sttModels = data.stt || [];

    // Format models for dropdown
    return sttModels.map(model => ({
      id: model.name,
      name: model.name,
      version: model.version || 'latest',
      tier: model.tier || 'base',
      language: model.language || 'en',
    }));
  } catch (error) {
    console.error('[Deepgram API] Error fetching models:', error);
    throw error;
  }
}

/**
 * Get default Deepgram models (fallback if API call fails)
 * @returns {Array<{id: string, name: string}>}
 */
export function getDefaultDeepgramModels() {
  return [
    { id: 'nova-2', name: 'Nova 2 (Recommended)' },
    { id: 'nova-3', name: 'Nova 3 (Latest)' },
    { id: 'nova', name: 'Nova' },
    { id: 'enhanced', name: 'Enhanced' },
    { id: 'base', name: 'Base' },
  ];
}

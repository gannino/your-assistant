// const def_prompt = `The following is a transcript of a live session. Please extract the last question or topic raised and provide a helpful response. If it is an algorithm question, please provide the approach and code implementation. If no question is found, there is no need to respond.`

// ============================================
// AI Provider Selection
// ============================================

function ai_provider() {
  return localStorage.getItem('ai_provider') || 'openai';
}

// ============================================
// Common Configuration
// ============================================

function gpt_system_prompt() {
  return localStorage.getItem('gpt_system_prompt');
}

// ============================================
// OpenAI Configuration
// ============================================

function openai_api_key() {
  return localStorage.getItem('openai_key');
}

function gpt_model() {
  return localStorage.getItem('gpt_model') || 'gpt-3.5-turbo';
}

function openai_temperature() {
  return parseFloat(localStorage.getItem('openai_temperature')) || 0.3;
}

// ============================================
// Z.ai Configuration
// ============================================

function zai_api_key() {
  return localStorage.getItem('zai_api_key');
}

function zai_model() {
  return localStorage.getItem('zai_model') || 'glm-4.7';
}

function zai_endpoint() {
  return localStorage.getItem('zai_endpoint') || 'https://api.z.ai/api/coding/paas/v4';
}

function zai_temperature() {
  return parseFloat(localStorage.getItem('zai_temperature')) || 0.3;
}

// ============================================
// Ollama Configuration
// ============================================

function ollama_endpoint() {
  return localStorage.getItem('ollama_endpoint') || 'http://localhost:11434';
}

function ollama_model() {
  return localStorage.getItem('ollama_model') || 'llama2';
}

function ollama_temperature() {
  return parseFloat(localStorage.getItem('ollama_temperature')) || 0.3;
}

// ============================================
// MLX Configuration
// ============================================

function mlx_endpoint() {
  return localStorage.getItem('mlx_endpoint') || 'http://localhost:8080';
}

function mlx_model() {
  return localStorage.getItem('mlx_model') || 'mlx-quantized';
}

function mlx_temperature() {
  return parseFloat(localStorage.getItem('mlx_temperature')) || 0.3;
}

// ============================================
// Anthropic Configuration
// ============================================

function anthropic_api_key() {
  return localStorage.getItem('anthropic_api_key');
}

function anthropic_model() {
  return localStorage.getItem('anthropic_model') || 'claude-3-sonnet-20240229';
}

function anthropic_temperature() {
  return parseFloat(localStorage.getItem('anthropic_temperature')) || 0.3;
}

// ============================================
// Gemini Configuration
// ============================================

function gemini_api_key() {
  return localStorage.getItem('gemini_api_key');
}

function gemini_model() {
  return localStorage.getItem('gemini_model') || 'gemini-1.5-flash';
}

function gemini_temperature() {
  return parseFloat(localStorage.getItem('gemini_temperature')) || 0.3;
}

// ============================================
// Transcription Provider Selection
// ============================================

function transcription_provider() {
  return localStorage.getItem('transcription_provider') || 'azure';
}

// ============================================
// Azure Speech Configuration (existing)
// ============================================

function azure_token() {
  return localStorage.getItem('azure_token');
}

function azure_language() {
  return localStorage.getItem('azure_language') || 'en-US';
}

function azure_region() {
  return localStorage.getItem('azure_region') || 'eastasia';
}

// ============================================
// Whisper Configuration
// ============================================

function whisper_api_key() {
  return localStorage.getItem('whisper_api_key');
}

function whisper_model() {
  return localStorage.getItem('whisper_model') || 'whisper-1';
}

function whisper_language() {
  return localStorage.getItem('whisper_language') || 'en';
}

// ============================================
// Web Speech Configuration
// ============================================

function webspeech_language() {
  return localStorage.getItem('webspeech_language') || 'en-US';
}

function webspeech_continuous() {
  return localStorage.getItem('webspeech_continuous') !== 'false';
}

function webspeech_interim_results() {
  return localStorage.getItem('webspeech_interim_results') === 'true';
}

// ============================================
// Deepgram Configuration
// ============================================

function deepgram_api_key() {
  return localStorage.getItem('deepgram_api_key');
}

function deepgram_model() {
  return localStorage.getItem('deepgram_model') || 'nova-2';
}

function deepgram_language() {
  return localStorage.getItem('deepgram_language') || 'en';
}

function scroll_speed() {
  return parseInt(localStorage.getItem('appearance_scroll_speed')) || 80;
}

// ============================================
// Export all configuration functions
// ============================================

export default {
  // AI Provider selection
  ai_provider,

  // Common
  gpt_system_prompt,

  // OpenAI
  openai_api_key,
  gpt_model,
  openai_temperature,

  // Z.ai
  zai_api_key,
  zai_model,
  zai_endpoint,
  zai_temperature,

  // Ollama
  ollama_endpoint,
  ollama_model,
  ollama_temperature,

  // MLX
  mlx_endpoint,
  mlx_model,
  mlx_temperature,

  // Anthropic
  anthropic_api_key,
  anthropic_model,
  anthropic_temperature,

  // Gemini
  gemini_api_key,
  gemini_model,
  gemini_temperature,

  // Transcription Provider selection
  transcription_provider,

  // Azure Speech
  azure_token,
  azure_language,
  azure_region,

  // Whisper
  whisper_api_key,
  whisper_model,
  whisper_language,

  // Web Speech
  webspeech_language,
  webspeech_continuous,
  webspeech_interim_results,

  // Deepgram
  deepgram_api_key,
  deepgram_model,
  deepgram_language,

  // Appearance
  scroll_speed,
};

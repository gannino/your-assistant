<template>
  <SettingsLayout>
    <div class="ai-settings">
      <p class="info-text">
        Configure your AI provider for generating assistant responses.
        <a
          href="https://github.com/gannino/your-assistant/blob/main/docs/AI_PROVIDERS_SETUP.md"
          target="_blank"
          >Setup guide</a
        >
      </p>

      <!-- Provider Selection -->
      <section class="settings-section">
        <h2>AI Provider</h2>
        <p class="section-desc">Choose your preferred AI service</p>

        <el-select v-model="ai_provider" style="width: 100%" @change="onProviderChange">
          <el-option label="OpenAI (GPT-5, o1, o3, GPT-4o)" value="openai" />
          <el-option label="Z.ai (GLM-4 series)" value="zai" />
          <el-option label="Ollama (Local, Free)" value="ollama" />
          <el-option label="MLX (Apple Silicon, Free)" value="mlx" />
          <el-option label="Anthropic Claude" value="anthropic" />
          <el-option label="Google Gemini (Vision)" value="gemini" />
          <el-option label="OpenRouter (300+ Models)" value="openrouter" />
        </el-select>

        <div v-if="ai_provider" class="test-section">
          <el-button size="small" :loading="loading_models" :icon="Refresh" @click="refreshModels">
            <span v-if="loading_models">
              <span class="loading-dots">Loading models</span>
              <span class="loading-dots">Loading models.</span>
              <span class="loading-dots">Loading models..</span>
              <span class="loading-dots">Loading models...</span>
            </span>
            <span v-else>Refresh Models</span>
          </el-button>
          <el-button
            size="small"
            :loading="testing_connection"
            :icon="Upload"
            type="info"
            @click="testConnection"
          >
            {{ testing_connection ? 'Testing...' : 'Test Connection' }}
          </el-button>
          <span v-if="model_error" class="error-text">{{ model_error }}</span>
          <span
            v-if="connection_result"
            :class="connection_result.success ? 'success-text' : 'error-text'"
          >
            {{ connection_result.message }}
          </span>
        </div>
      </section>

      <!-- OpenAI Settings -->
      <section v-show="ai_provider === 'openai'" class="settings-section">
        <h2>OpenAI</h2>
        <p class="section-desc">
          GPT-5, o1, o3, GPT-4o and more.
          <a href="https://platform.openai.com/api-keys" target="_blank">Get API key</a>
        </p>

        <div class="form-group">
          <label>API Key</label>
          <el-input
            v-model="openai_key"
            placeholder="sk-..."
            show-password
            @change="onKeyChange('openai_key')"
          />
        </div>

        <div class="form-group">
          <label>Model</label>
          <el-select
            v-model="gpt_model"
            style="width: 100%"
            :loading="loading_models"
            allow-create
            filterable
            @change="onKeyChange('gpt_model')"
          >
            <el-option
              v-for="model in openai_models"
              :key="model"
              :label="getModelLabel(model)"
              :value="model"
            />
          </el-select>
          <p v-if="openai_models.length === 0 && !loading_models" class="field-hint">
            Enter API key to load available models
          </p>
          <p v-else class="field-hint">
            Can't find your model? Type custom model name (e.g., gpt-4-turbo-2024-04-09).
            <a href="https://platform.openai.com/docs/models" target="_blank">View all models</a>
          </p>
        </div>

        <div class="form-group">
          <label>Temperature: {{ openai_temperature }}</label>
          <el-slider
            v-model="openai_temperature"
            :min="0"
            :max="2"
            :step="0.1"
            :show-tooltip="true"
            style="width: 100%"
            @change="onKeyChange('openai_temperature')"
          />
          <p class="field-hint">
            Controls randomness. 1.0 = default (some models only support 1.0), 0 = focused, 2 =
            creative
          </p>
        </div>
      </section>

      <!-- Z.ai Settings -->
      <section v-show="ai_provider === 'zai'" class="settings-section">
        <h2>Z.ai (Zhipu AI)</h2>
        <p class="section-desc">
          GLM-4 series models, great for Chinese.
          <a href="https://open.bigmodel.cn" target="_blank">Get API key</a>
        </p>

        <div class="form-group">
          <label>API Key</label>
          <el-input
            v-model="zai_api_key"
            placeholder="Enter Z.ai API Key"
            show-password
            @change="onKeyChange('zai_api_key')"
          />
        </div>

        <div class="form-group">
          <label>Model</label>
          <el-select
            v-model="zai_model"
            style="width: 100%"
            allow-create
            filterable
            @change="onKeyChange('zai_model')"
          >
            <el-option
              v-for="model in zai_models"
              :key="model"
              :label="getModelLabel(model)"
              :value="model"
            />
          </el-select>
          <p class="field-hint">
            Type custom model name if needed.
            <a href="https://open.bigmodel.cn/dev/api" target="_blank">View all models</a>
          </p>
        </div>

        <div class="form-group">
          <label>API Endpoint</label>
          <div class="input-row">
            <el-input
              v-model="zai_endpoint"
              placeholder="https://api.z.ai/api/coding/paas/v4"
              @change="onKeyChange('zai_endpoint')"
            />
            <el-button size="small" :icon="RefreshLeft" @click="restoreDefaultEndpoint('zai')"
              >Reset</el-button
            >
          </div>
        </div>

        <div class="form-group">
          <label>Temperature: {{ zai_temperature }}</label>
          <el-slider
            v-model="zai_temperature"
            :min="0"
            :max="1"
            :step="0.1"
            :show-tooltip="true"
            style="width: 100%"
            @change="onKeyChange('zai_temperature')"
          />
          <p class="field-hint">
            Controls randomness. 0.3 = focused, 1.0 = creative. Range: 0-1 for GLM models
          </p>
        </div>
      </section>

      <!-- Ollama Settings -->
      <section v-show="ai_provider === 'ollama'" class="settings-section">
        <h2>Ollama (Local)</h2>
        <p class="section-desc">
          Run models locally. No API key required.
          <a href="https://ollama.ai" target="_blank">Install Ollama</a>
        </p>

        <el-alert type="success" :closable="false" style="margin-bottom: 16px">
          <template #title>✨ Completely FREE</template>
          <p style="margin: 8px 0 0 0">Runs locally on your machine. No API costs.</p>
        </el-alert>

        <div class="form-group">
          <label>Endpoint</label>
          <div class="input-row">
            <el-input
              v-model="ollama_endpoint"
              placeholder="http://localhost:11434"
              @change="onKeyChange('ollama_endpoint')"
            />
            <el-button size="small" :icon="RefreshLeft" @click="restoreDefaultEndpoint('ollama')"
              >Reset</el-button
            >
          </div>
        </div>

        <div class="form-group">
          <label>Model</label>
          <el-select
            v-model="ollama_model"
            style="width: 100%"
            :loading="loading_models"
            allow-create
            filterable
            @change="onKeyChange('ollama_model')"
          >
            <el-option v-for="model in ollama_models" :key="model" :label="model" :value="model" />
          </el-select>
          <p v-if="ollama_models.length === 0 && !loading_models" class="field-hint">
            Could not connect to Ollama. Make sure it's running: <code>ollama serve</code>
          </p>
          <p v-else class="field-hint">
            Type custom model name if you've pulled additional models.
            <a href="https://ollama.ai/library" target="_blank">Browse models</a>
          </p>
        </div>

        <div class="form-group">
          <label>Temperature: {{ ollama_temperature }}</label>
          <el-slider
            v-model="ollama_temperature"
            :min="0"
            :max="2"
            :step="0.1"
            :show-tooltip="true"
            style="width: 100%"
            @change="onKeyChange('ollama_temperature')"
          />
          <p class="field-hint">
            Controls randomness. 0.3 = focused, 1.0 = balanced, 2 = creative. Range varies by model
          </p>
        </div>
      </section>

      <!-- MLX Settings -->
      <section v-show="ai_provider === 'mlx'" class="settings-section">
        <h2>MLX (Apple Silicon)</h2>
        <p class="section-desc">
          Optimized for Apple Silicon (M1/M2/M3). No API key required.
          <a href="https://github.com/ml-explore/mlx" target="_blank">Install MLX</a>
        </p>

        <el-alert type="success" :closable="false" style="margin-bottom: 16px">
          <template #title>✨ Completely FREE</template>
          <p style="margin: 8px 0 0 0">Runs locally on Apple Silicon. No API costs.</p>
        </el-alert>

        <div class="form-group">
          <label>Endpoint</label>
          <div class="input-row">
            <el-input
              v-model="mlx_endpoint"
              placeholder="http://localhost:8080"
              @change="onKeyChange('mlx_endpoint')"
            />
            <el-button size="small" :icon="RefreshLeft" @click="restoreDefaultEndpoint('mlx')"
              >Reset</el-button
            >
          </div>
        </div>

        <div class="form-group">
          <label>Model</label>
          <el-select
            v-model="mlx_model"
            style="width: 100%"
            allow-create
            filterable
            @change="onKeyChange('mlx_model')"
          >
            <el-option v-for="model in mlx_models" :key="model" :label="model" :value="model" />
          </el-select>
          <p class="field-hint">
            Type custom model name if needed.
            <a href="https://github.com/ml-explore/mlx-examples" target="_blank">View MLX models</a>
          </p>
        </div>

        <div class="form-group">
          <label>Temperature: {{ mlx_temperature }}</label>
          <el-slider
            v-model="mlx_temperature"
            :min="0"
            :max="2"
            :step="0.1"
            :show-tooltip="true"
            style="width: 100%"
            @change="onKeyChange('mlx_temperature')"
          />
          <p class="field-hint">
            Controls randomness. 0.3 = focused, 1.0 = balanced, 2 = creative. Range varies by model
          </p>
        </div>
      </section>

      <!-- Anthropic Settings -->
      <section v-show="ai_provider === 'anthropic'" class="settings-section">
        <h2>Anthropic Claude</h2>
        <p class="section-desc">
          Claude 3 models (Haiku, Sonnet, Opus).
          <a href="https://console.anthropic.com" target="_blank">Get API key</a>
        </p>

        <div class="form-group">
          <label>API Key</label>
          <el-input
            v-model="anthropic_api_key"
            placeholder="sk-ant-..."
            show-password
            @change="onKeyChange('anthropic_api_key')"
          />
        </div>

        <div class="form-group">
          <label>Model</label>
          <el-select
            v-model="anthropic_model"
            style="width: 100%"
            :loading="loading_models"
            allow-create
            filterable
            @change="onKeyChange('anthropic_model')"
          >
            <el-option
              v-for="model in anthropic_models"
              :key="model"
              :label="getModelLabel(model)"
              :value="model"
            />
          </el-select>
          <p v-if="anthropic_models.length === 0 && !loading_models" class="field-hint">
            Enter API key to load available models
          </p>
          <p v-else class="field-hint">
            Type custom model name if needed.
            <a href="https://docs.anthropic.com/en/docs/about-claude/models" target="_blank"
              >View all models</a
            >
          </p>
        </div>

        <div class="form-group">
          <label>Temperature: {{ anthropic_temperature }}</label>
          <el-slider
            v-model="anthropic_temperature"
            :min="0"
            :max="1"
            :step="0.1"
            :show-tooltip="true"
            style="width: 100%"
            @change="onKeyChange('anthropic_temperature')"
          />
          <p class="field-hint">
            Controls randomness. 0.3 = focused, 1.0 = creative. Range: 0-1 for Claude models
          </p>
        </div>
      </section>
      <!-- Gemini Settings -->
      <section v-show="ai_provider === 'gemini'" class="settings-section">
        <h2>Google Gemini</h2>
        <p class="section-desc">
          Gemini 1.5 Flash/Pro with vision support — can analyse screenshots.
          <a href="https://aistudio.google.com/app/apikey" target="_blank">Get API key</a>
        </p>

        <div class="form-group">
          <label>API Key</label>
          <el-input
            v-model="gemini_api_key"
            placeholder="AIza..."
            show-password
            @change="onKeyChange('gemini_api_key')"
          />
        </div>

        <div class="form-group">
          <label>Model</label>
          <el-select
            v-model="gemini_model"
            style="width: 100%"
            allow-create
            filterable
            @change="onKeyChange('gemini_model')"
          >
            <el-option v-for="model in gemini_models" :key="model" :label="model" :value="model" />
          </el-select>
          <p class="field-hint">
            Flash models are faster and cheaper; Pro models are more capable.
            <a href="https://ai.google.dev/gemini-api/docs/models/gemini" target="_blank"
              >View all models</a
            >
          </p>
        </div>

        <div class="form-group">
          <label>Temperature: {{ gemini_temperature }}</label>
          <el-slider
            v-model="gemini_temperature"
            :min="0"
            :max="1"
            :step="0.1"
            :show-tooltip="true"
            style="width: 100%"
            @change="onKeyChange('gemini_temperature')"
          />
        </div>
      </section>

      <!-- OpenRouter Settings -->
      <section v-show="ai_provider === 'openrouter'" class="settings-section">
        <h2>OpenRouter</h2>
        <p class="section-desc">
          Access to 300+ LLMs including GPT-4, Claude, Gemini, Llama, and more through a single API.
          <a href="https://openrouter.ai/keys" target="_blank">Get API key</a>
          •
          <a href="https://openrouter.ai/models" target="_blank">View all models</a>
        </p>

        <div class="form-group">
          <label>API Key</label>
          <el-input
            v-model="openrouter_api_key"
            placeholder="sk-or-v1-..."
            show-password
            @change="onKeyChange('openrouter_api_key')"
          />
          <p class="field-hint">Your API key starts with "sk-or-v1-"</p>
        </div>

        <div class="form-group">
          <label>Model</label>
          <el-select
            v-model="openrouter_model"
            style="width: 100%"
            allow-create
            filterable
            @change="onKeyChange('openrouter_model')"
          >
            <el-option
              v-for="model in openrouter_models"
              :key="model"
              :label="model"
              :value="model"
            />
          </el-select>
          <p class="field-hint">
            Choose from 300+ models. Popular: anthropic/claude-sonnet-4, openai/gpt-4o,
            google/gemini-pro-1.5
          </p>
        </div>

        <div class="form-group">
          <label>Temperature: {{ openrouter_temperature }}</label>
          <el-slider
            v-model="openrouter_temperature"
            :min="0"
            :max="2"
            :step="0.1"
            :show-tooltip="true"
            style="width: 100%"
            @change="onKeyChange('openrouter_temperature')"
          />
          <p class="field-hint">
            Controls randomness. 0.3 = focused, 1.0 = creative. Range varies by model.
          </p>
        </div>
      </section>
    </div>
  </SettingsLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Refresh, Upload, RefreshLeft } from '@element-plus/icons-vue';
import SettingsLayout from './SettingsLayout.vue';
import config_util from '../../utils/config_util';
import { providerRegistry } from '../../services/ai/providerRegistry';

// Provider
const ai_provider = ref('openai');

// OpenAI
const openai_key = ref('');
const gpt_model = ref('gpt-3.5-turbo');
const openai_models = ref([]);
const openai_temperature = ref(0.3);

// Z.ai
const zai_api_key = ref('');
const zai_model = ref('glm-4.7');
const zai_endpoint = ref('https://api.z.ai/api/coding/paas/v4');
const zai_models = ref([]);
const zai_temperature = ref(0.3);

// Ollama
const ollama_endpoint = ref('http://localhost:11434');
const ollama_model = ref('llama2');
const ollama_models = ref([]);
const ollama_temperature = ref(0.3);

// MLX
const mlx_endpoint = ref('http://localhost:8080');
const mlx_model = ref('mlx-quantized');
const mlx_models = ref([]);
const mlx_temperature = ref(0.3);

// Anthropic
const anthropic_api_key = ref('');
const anthropic_model = ref('claude-3-sonnet-20240229');
const anthropic_models = ref([]);
const anthropic_temperature = ref(0.3);

// Gemini
const gemini_api_key = ref('');
const gemini_model = ref('gemini-1.5-flash');
const gemini_models = ref([]);
const gemini_temperature = ref(0.3);

// OpenRouter
const openrouter_api_key = ref('');
const openrouter_model = ref('anthropic/claude-sonnet-4');
const openrouter_models = ref([]);
const openrouter_temperature = ref(0.3);

// State
const loading_models = ref(false);
const model_error = ref(null);
const testing_connection = ref(false);
const connection_result = ref(null);

const defaultEndpoints = {
  zai: 'https://api.z.ai/api/coding/paas/v4',
  ollama: 'http://localhost:11434',
  mlx: 'http://localhost:8080',
};

const modelLabels = {
  'gpt-5.4': 'GPT-5.4 (Latest)',
  'gpt-5.2': 'GPT-5.2',
  o1: 'o1',
  'o1-mini': 'o1 Mini',
  'o3-mini': 'o3 Mini',
  'chatgpt-4o-latest': 'ChatGPT-4o Latest',
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'glm-4.7': 'GLM-4.7 (Latest)',
  'glm-4.7-ari': 'GLM-4.7 Air',
  'glm-4-turbo': 'GLM-4 Turbo',
  'glm-4-air': 'GLM-4 Air',
  'claude-3-haiku-20240307': 'Claude 3 Haiku (Fast)',
  'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
  'claude-3-opus-20240229': 'Claude 3 Opus (Best)',
  'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
  'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
};

const getModelLabel = modelId => modelLabels[modelId] || modelId;

const getProviderConfig = providerId => {
  switch (providerId) {
    case 'openai':
      return {
        apiKey: openai_key.value,
        model: gpt_model.value,
        temperature: openai_temperature.value,
      };
    case 'zai':
      return {
        apiKey: zai_api_key.value,
        model: zai_model.value,
        endpoint: zai_endpoint.value,
        temperature: zai_temperature.value,
      };
    case 'ollama':
      return {
        endpoint: ollama_endpoint.value,
        model: ollama_model.value,
        temperature: ollama_temperature.value,
      };
    case 'mlx':
      return {
        endpoint: mlx_endpoint.value,
        model: mlx_model.value,
        temperature: mlx_temperature.value,
      };
    case 'anthropic':
      return {
        apiKey: anthropic_api_key.value,
        model: anthropic_model.value,
        temperature: anthropic_temperature.value,
      };
    case 'gemini':
      return {
        apiKey: gemini_api_key.value,
        model: gemini_model.value,
        temperature: gemini_temperature.value,
      };
    case 'openrouter':
      return {
        apiKey: openrouter_api_key.value,
        model: openrouter_model.value,
        temperature: openrouter_temperature.value,
      };
    default:
      return {};
  }
};

const setDefaultModels = providerId => {
  const defaults = {
    openai: [
      'gpt-5.4',
      'gpt-5.2',
      'o1',
      'o1-mini',
      'o3-mini',
      'chatgpt-4o-latest',
      'gpt-4o',
      'gpt-4o-mini',
    ],
    zai: ['glm-4.7', 'glm-4.7-ari', 'glm-4-turbo', 'glm-4-air'],
    ollama: ['llama2', 'mistral', 'codellama', 'gemma', 'phi', 'mixtral'],
    mlx: ['mlx-quantized', 'mlx-full', 'llama-mlx', 'mistral-mlx'],
    anthropic: [
      'claude-sonnet-4-6',
      'claude-opus-4-6',
      'claude-haiku-4-5-20251001',
      'claude-opus-4-5-20251101',
      'claude-opus-4-1-20250805',
      'claude-opus-4-20250514',
      'claude-sonnet-4-5-20250929',
      'claude-sonnet-4-20250514',
    ],
    gemini: [
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
    ],
    openrouter: [
      'anthropic/claude-sonnet-4',
      'anthropic/claude-opus-4',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'google/gemini-pro-1.5',
      'google/gemini-flash-1.5',
      'meta-llama/llama-3.1-70b-instruct',
      'mistralai/mistral-large',
    ],
  };
  const models = defaults[providerId] || [];
  switch (providerId) {
    case 'openai':
      openai_models.value = models;
      break;
    case 'zai':
      zai_models.value = models;
      break;
    case 'ollama':
      ollama_models.value = models;
      break;
    case 'mlx':
      mlx_models.value = models;
      break;
    case 'anthropic':
      anthropic_models.value = models;
      break;
    case 'gemini':
      gemini_models.value = models;
      break;
    case 'openrouter':
      openrouter_models.value = models;
      break;
  }
};

const loadModelsForProvider = async providerId => {
  loading_models.value = true;
  model_error.value = null;

  try {
    const provider = providerRegistry.get(providerId);
    if (!provider) throw new Error(`Provider ${providerId} not found`);

    const config = getProviderConfig(providerId);
    const providerInfo = provider.getProviderInfo();

    if (providerInfo.requiresApiKey && !config.apiKey) {
      setDefaultModels(providerId);
      return;
    }

    try {
      await provider.initialize(config);
      const models = await provider.getAvailableModels();
      switch (providerId) {
        case 'openai':
          openai_models.value = models;
          break;
        case 'zai':
          zai_models.value = models;
          break;
        case 'ollama':
          ollama_models.value = models;
          break;
        case 'mlx':
          mlx_models.value = models;
          break;
        case 'anthropic':
          anthropic_models.value = models;
          break;
        case 'gemini':
          gemini_models.value = models;
          break;
        case 'openrouter':
          openrouter_models.value = models;
          break;
      }
    } catch {
      setDefaultModels(providerId);
    }
  } catch (error) {
    model_error.value = error.message;
    setDefaultModels(providerId);
  } finally {
    loading_models.value = false;
  }
};

const refreshModels = () => loadModelsForProvider(ai_provider.value);

const testConnection = async () => {
  testing_connection.value = true;
  connection_result.value = null;

  try {
    const provider = providerRegistry.get(ai_provider.value);
    if (!provider) {
      connection_result.value = { success: false, message: `Provider not found` };
      return;
    }

    const config = getProviderConfig(ai_provider.value);
    await provider.initialize(config);

    if (ai_provider.value === 'zai') {
      const result = await provider.testConnection();
      connection_result.value = result.success
        ? { success: true, message: '✓ Connection successful' }
        : { success: false, message: `✗ ${result.error}` };
    } else {
      const validation = await provider.validateConfig();
      connection_result.value = validation.valid
        ? { success: true, message: '✓ Configuration valid' }
        : { success: false, message: `✗ ${validation.errors.join(', ')}` };
    }
  } catch (error) {
    connection_result.value = { success: false, message: `✗ ${error.message}` };
  } finally {
    testing_connection.value = false;
    if (connection_result.value?.success) {
      setTimeout(() => {
        connection_result.value = null;
      }, 3000);
    }
  }
};

const restoreDefaultEndpoint = providerId => {
  const endpoint = defaultEndpoints[providerId];
  if (!endpoint) return;
  if (providerId === 'zai') zai_endpoint.value = endpoint;
  else if (providerId === 'ollama') ollama_endpoint.value = endpoint;
  else if (providerId === 'mlx') mlx_endpoint.value = endpoint;
  localStorage.setItem(`${providerId}_endpoint`, endpoint);
  connection_result.value = { success: true, message: '✓ Endpoint restored' };
  setTimeout(() => {
    connection_result.value = null;
  }, 2000);
};

const onKeyChange = key_name => {
  const map = {
    openai_key: openai_key.value,
    gpt_model: gpt_model.value,
    openai_temperature: openai_temperature.value,
    zai_api_key: zai_api_key.value,
    zai_model: zai_model.value,
    zai_endpoint: zai_endpoint.value,
    zai_temperature: zai_temperature.value,
    ollama_endpoint: ollama_endpoint.value,
    ollama_model: ollama_model.value,
    ollama_temperature: ollama_temperature.value,
    mlx_endpoint: mlx_endpoint.value,
    mlx_model: mlx_model.value,
    mlx_temperature: mlx_temperature.value,
    anthropic_api_key: anthropic_api_key.value,
    anthropic_model: anthropic_model.value,
    anthropic_temperature: anthropic_temperature.value,
    gemini_api_key: gemini_api_key.value,
    gemini_model: gemini_model.value,
    gemini_temperature: gemini_temperature.value,
    openrouter_api_key: openrouter_api_key.value,
    openrouter_model: openrouter_model.value,
    openrouter_temperature: openrouter_temperature.value,
  };
  localStorage.setItem(key_name, map[key_name]);

  // Reload models when key/endpoint changes
  const reloadTriggers = {
    openai_key: 'openai',
    zai_api_key: 'zai',
    zai_endpoint: 'zai',
    anthropic_api_key: 'anthropic',
    ollama_endpoint: 'ollama',
    mlx_endpoint: 'mlx',
    gemini_api_key: 'gemini',
    openrouter_api_key: 'openrouter',
  };
  if (reloadTriggers[key_name] && reloadTriggers[key_name] === ai_provider.value) {
    loadModelsForProvider(ai_provider.value);
  }
};

const onProviderChange = async value => {
  localStorage.setItem('ai_provider', value);
  await loadModelsForProvider(value);
};

onMounted(() => {
  ai_provider.value = config_util.ai_provider();

  openai_key.value = config_util.openai_api_key();
  gpt_model.value = config_util.gpt_model();
  openai_temperature.value = config_util.openai_temperature();

  zai_api_key.value = config_util.zai_api_key();
  zai_model.value = config_util.zai_model();
  zai_endpoint.value = config_util.zai_endpoint();
  zai_temperature.value = config_util.zai_temperature();

  ollama_endpoint.value = config_util.ollama_endpoint();
  ollama_model.value = config_util.ollama_model();
  ollama_temperature.value = config_util.ollama_temperature();

  mlx_endpoint.value = config_util.mlx_endpoint();
  mlx_model.value = config_util.mlx_model();
  mlx_temperature.value = config_util.mlx_temperature();

  anthropic_api_key.value = config_util.anthropic_api_key();
  anthropic_model.value = config_util.anthropic_model();
  anthropic_temperature.value = config_util.anthropic_temperature();

  gemini_api_key.value = config_util.gemini_api_key();
  gemini_model.value = config_util.gemini_model();
  gemini_temperature.value = config_util.gemini_temperature();

  openrouter_api_key.value = config_util.openrouter_api_key();
  openrouter_model.value = config_util.openrouter_model();
  openrouter_temperature.value = config_util.openrouter_temperature();

  loadModelsForProvider(ai_provider.value);
});
</script>

<style scoped>
.ai-settings {
  max-width: 100%;
}

.loading-dots {
  animation: dots 1.4s infinite;
}

@keyframes dots {
  0%,
  20% {
    opacity: 0.2;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.2;
  }
}

.info-text {
  color: #606266;
  font-size: 14px;
  margin-bottom: 32px;
  line-height: 1.6;
}

.info-text a {
  color: #409eff;
  text-decoration: none;
}

.settings-section {
  margin-bottom: 40px;
}

.settings-section h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.section-desc {
  font-size: 14px;
  color: #909399;
  margin: 0 0 16px 0;
}

.section-desc a {
  color: #409eff;
  text-decoration: none;
}

.test-section {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.success-text {
  color: #67c23a;
  font-size: 14px;
}

.error-text {
  color: #f56c6c;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.field-hint {
  font-size: 12px;
  color: #909399;
  margin: 6px 0 0 0;
}

.field-hint {
  font-size: 12px;
  color: #909399;
  margin: 6px 0 0 0;
}

.field-hint a {
  color: #409eff;
  text-decoration: none;
}

.field-hint code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.input-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.input-row .el-input {
  flex: 1;
}
</style>

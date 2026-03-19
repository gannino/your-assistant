<template>
  <SettingsLayout>
    <div class="speech-settings">
      <p class="info-text">
        Configure speech-to-text providers for session transcription.
        <a
          href="https://github.com/gannino/your-assistant/blob/main/docs/TRANSCRIPTION_PROVIDERS_SETUP.md"
          target="_blank"
          >Setup guide</a
        >
      </p>

      <!-- Provider Selection -->
      <section class="settings-section">
        <h2>Speech Recognition Provider</h2>
        <p class="section-desc">Choose your preferred transcription service</p>

        <el-select
          v-model="transcription_provider"
          style="width: 100%"
          @change="onTranscriptionProviderChange"
        >
          <el-option label="Microsoft Azure (High Accuracy)" value="azure" />
          <el-option label="OpenAI Whisper (Best Quality)" value="whisper" />
          <el-option label="Web Speech API (Free)" value="webspeech" />
          <el-option label="Deepgram (Real-time)" value="deepgram" />
        </el-select>

        <div v-if="transcription_provider" class="test-section">
          <el-button
            size="small"
            :loading="testing_transcription"
            :icon="Upload"
            type="info"
            @click="testTranscriptionConnection"
          >
            {{ testing_transcription ? 'Testing...' : 'Test Connection' }}
          </el-button>
          <span
            v-if="transcription_test_result"
            :class="transcription_test_result.success ? 'success-text' : 'error-text'"
          >
            {{ transcription_test_result.message }}
          </span>
        </div>
      </section>

      <!-- Azure Settings -->
      <section v-show="transcription_provider === 'azure'" class="settings-section">
        <h2>Microsoft Azure Speech</h2>
        <p class="section-desc">
          High accuracy speech recognition.
          <a
            href="https://github.com/gannino/your-assistant/blob/main/docs/AZURE_SERVICE_TUTORIAL.md"
            target="_blank"
            >Get free API key</a
          >
        </p>

        <div class="form-group">
          <label>API Key</label>
          <el-input
            v-model="azure_token"
            placeholder="Enter Azure Speech API Key"
            show-password
            @change="onKeyChange('azure_token')"
          />
        </div>

        <div class="form-group">
          <label>Region</label>
          <el-input
            v-model="azure_region"
            placeholder="e.g. eastasia, westus"
            @change="onKeyChange('azure_region')"
          />
        </div>

        <div class="form-group">
          <label>Language</label>
          <el-select
            v-model="azure_language"
            style="width: 100%"
            allow-create
            filterable
            @change="onKeyChange('azure_language')"
          >
            <el-option label="English (US)" value="en-US" />
            <el-option label="English (UK)" value="en-GB" />
            <el-option label="Chinese (Mandarin)" value="zh-CN" />
            <el-option label="Spanish" value="es-ES" />
            <el-option label="French" value="fr-FR" />
            <el-option label="German" value="de-DE" />
            <el-option label="Italian" value="it-IT" />
            <el-option label="Japanese" value="ja-JP" />
            <el-option label="Korean" value="ko-KR" />
          </el-select>
          <p class="field-hint">
            <a
              href="https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=stt"
              target="_blank"
              >View all supported languages</a
            >
          </p>
        </div>

        <el-alert v-if="isIOS" type="warning" :closable="false" style="margin-top: 16px">
          <template #title>iOS Safari - Limited Support</template>
          <p style="margin: 8px 0 0 0; font-size: 14px">
            Azure has limited microphone access on iOS. Consider using Whisper provider for better
            iOS support.
          </p>
        </el-alert>
      </section>

      <!-- Whisper Settings -->
      <section v-show="transcription_provider === 'whisper'" class="settings-section">
        <h2>OpenAI Whisper</h2>
        <p class="section-desc">
          State-of-the-art accuracy.
          <a href="https://platform.openai.com/api-keys" target="_blank">Get API key</a>
        </p>

        <div class="form-group">
          <label>API Key</label>
          <el-input
            v-model="whisper_api_key"
            placeholder="sk-..."
            show-password
            @change="onKeyChange('whisper_api_key')"
          />
        </div>

        <div class="form-group">
          <label>Model</label>
          <el-select
            v-model="whisper_model"
            style="width: 100%"
            allow-create
            filterable
            @change="onKeyChange('whisper_model')"
          >
            <el-option label="Whisper v1" value="whisper-1" />
          </el-select>
          <p class="field-hint">
            Type custom model name if needed.
            <a href="https://platform.openai.com/docs/models/whisper" target="_blank"
              >View Whisper models</a
            >
          </p>
        </div>

        <div class="form-group">
          <label>Language</label>
          <el-select
            v-model="whisper_language"
            style="width: 100%"
            allow-create
            filterable
            @change="onKeyChange('whisper_language')"
          >
            <el-option label="English" value="en" />
            <el-option label="Chinese" value="zh" />
            <el-option label="Spanish" value="es" />
            <el-option label="French" value="fr" />
            <el-option label="German" value="de" />
            <el-option label="Italian" value="it" />
            <el-option label="Japanese" value="ja" />
            <el-option label="Korean" value="ko" />
          </el-select>
          <p class="field-hint">
            <a
              href="https://platform.openai.com/docs/guides/speech-to-text/supported-languages"
              target="_blank"
              >View all supported languages</a
            >
          </p>
        </div>
      </section>

      <!-- Web Speech Settings -->
      <section v-show="transcription_provider === 'webspeech'" class="settings-section">
        <h2>Web Speech API (Free)</h2>
        <p class="section-desc">
          Browser built-in speech recognition. No API key required! Works in Chrome/Edge.
        </p>

        <el-alert type="success" :closable="false" style="margin-bottom: 16px">
          <template #title>✨ Completely FREE</template>
          <p style="margin: 8px 0 0 0">No setup required - just select language and start using!</p>
        </el-alert>

        <div class="form-group">
          <label>Language</label>
          <el-select
            v-model="webspeech_language"
            style="width: 100%"
            allow-create
            filterable
            @change="onKeyChange('webspeech_language')"
          >
            <el-option label="English (US)" value="en-US" />
            <el-option label="English (UK)" value="en-GB" />
            <el-option label="Chinese (Mandarin)" value="zh-CN" />
            <el-option label="Spanish" value="es-ES" />
            <el-option label="French" value="fr-FR" />
            <el-option label="German" value="de-DE" />
            <el-option label="Italian" value="it-IT" />
            <el-option label="Japanese" value="ja-JP" />
            <el-option label="Korean" value="ko-KR" />
          </el-select>
          <p class="field-hint">
            Enter custom language code (e.g., en-GB, fr-CA).
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/lang"
              target="_blank"
              >Language codes reference</a
            >
          </p>
        </div>

        <div class="form-group">
          <el-checkbox
            v-model="webspeech_continuous"
            :disabled="isIOS"
            @change="onKeyChange('webspeech_continuous')"
          >
            Continuous Mode
          </el-checkbox>
          <p class="checkbox-desc">
            Keep listening after pauses
            <span v-if="isIOS" style="color: #e6a23c">(Not supported on iOS)</span>
          </p>
        </div>

        <div class="form-group">
          <el-checkbox
            v-model="webspeech_interim_results"
            @change="onKeyChange('webspeech_interim_results')"
          >
            Show Interim Results
          </el-checkbox>
          <p class="checkbox-desc">Display partial results before finalizing</p>
        </div>

        <el-alert v-if="isIOS" type="warning" :closable="false" style="margin-top: 16px">
          <template #title>iOS Safari - Limited Support</template>
          <p style="margin: 8px 0 0 0; font-size: 14px">
            iOS Safari has limited Web Speech API support. May stop unexpectedly. Consider Azure,
            Whisper, or Deepgram for better iOS experience.
          </p>
        </el-alert>
      </section>

      <!-- Deepgram Settings -->
      <section v-show="transcription_provider === 'deepgram'" class="settings-section">
        <h2>Deepgram (Real-time)</h2>
        <p class="section-desc">
          Low latency streaming transcription.
          <a href="https://console.deepgram.com/" target="_blank">Get API key</a> (200 free
          hours/month)
        </p>

        <div class="form-group">
          <label>API Key</label>
          <el-input
            v-model="deepgram_api_key"
            placeholder="Deepgram API Key"
            show-password
            @change="onKeyChange('deepgram_api_key')"
          />
        </div>

        <div class="form-group">
          <label>Model</label>
          <el-select
            v-model="deepgram_model"
            style="width: 100%"
            allow-create
            filterable
            @change="onKeyChange('deepgram_model')"
          >
            <el-option label="Nova-2 (Latest & Fastest)" value="nova-2" />
            <el-option label="Nova" value="nova" />
            <el-option label="Enhanced" value="enhanced" />
          </el-select>
          <p class="field-hint">
            Type custom model name if needed.
            <a href="https://developers.deepgram.com/docs/models-overview" target="_blank"
              >View all models</a
            >
          </p>
        </div>

        <div class="form-group">
          <label>Language</label>
          <el-select
            v-model="deepgram_language"
            style="width: 100%"
            allow-create
            filterable
            @change="onKeyChange('deepgram_language')"
          >
            <el-option label="English" value="en" />
            <el-option label="Chinese" value="zh" />
            <el-option label="Spanish" value="es" />
            <el-option label="French" value="fr" />
            <el-option label="German" value="de" />
            <el-option label="Italian" value="it" />
            <el-option label="Japanese" value="ja" />
            <el-option label="Korean" value="ko" />
          </el-select>
          <p class="field-hint">
            <a href="https://developers.deepgram.com/docs/languages-overview" target="_blank"
              >View all supported languages</a
            >
          </p>
        </div>
      </section>
    </div>
  </SettingsLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Upload } from '@element-plus/icons-vue';
import SettingsLayout from './SettingsLayout.vue';
import config_util from '../../utils/config_util';
import { transcriptionRegistry } from '../../services/transcription/transcriptionRegistry';

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// Provider Selection
const transcription_provider = ref('azure');

// Azure Settings
const azure_token = ref('');
const azure_region = ref('');
const azure_language = ref('');

// Whisper Settings
const whisper_api_key = ref('');
const whisper_model = ref('whisper-1');
const whisper_language = ref('en');

// Web Speech Settings
const webspeech_language = ref('en-US');
const webspeech_continuous = ref(true);
const webspeech_interim_results = ref(false);

// Deepgram Settings
const deepgram_api_key = ref('');
const deepgram_model = ref('nova-2');
const deepgram_language = ref('en');

// Testing
const testing_transcription = ref(false);
const transcription_test_result = ref(null);

const testTranscriptionConnection = async () => {
  testing_transcription.value = true;
  transcription_test_result.value = null;

  try {
    const provider = transcriptionRegistry.get(transcription_provider.value);
    if (!provider) {
      transcription_test_result.value = {
        success: false,
        message: `Provider ${transcription_provider.value} not found`,
      };
      return;
    }

    const config = getTranscriptionProviderConfig(transcription_provider.value);

    if (transcription_provider.value === 'webspeech') {
      const supported = provider.checkBrowserSupport();
      if (!supported) {
        transcription_test_result.value = {
          success: false,
          message: '✗ Web Speech API not supported (requires Chrome/Edge)',
        };
        return;
      }
    }

    await provider.initialize(config);
    const validation = await provider.validateConfig();

    if (!validation.valid) {
      transcription_test_result.value = {
        success: false,
        message: `✗ ${validation.errors.join(', ')}`,
      };
      return;
    }

    transcription_test_result.value = {
      success: true,
      message: `✓ Configuration valid`,
    };
  } catch (error) {
    transcription_test_result.value = {
      success: false,
      message: `✗ Error: ${error.message}`,
    };
  } finally {
    testing_transcription.value = false;

    if (transcription_test_result.value?.success) {
      setTimeout(() => {
        transcription_test_result.value = null;
      }, 5000);
    }
  }
};

const getTranscriptionProviderConfig = providerId => {
  switch (providerId) {
    case 'azure':
      return {
        azureToken: azure_token.value,
        azureRegion: azure_region.value,
        language: azure_language.value,
      };
    case 'whisper':
      return {
        apiKey: whisper_api_key.value,
        model: whisper_model.value,
        language: whisper_language.value,
      };
    case 'webspeech':
      return {
        language: webspeech_language.value,
        continuous: webspeech_continuous.value,
        interimResults: webspeech_interim_results.value,
      };
    case 'deepgram':
      return {
        apiKey: deepgram_api_key.value,
        model: deepgram_model.value,
        language: deepgram_language.value,
      };
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
};

const onKeyChange = key_name => {
  let value;
  switch (key_name) {
    case 'azure_token':
      value = azure_token.value;
      break;
    case 'azure_region':
      value = azure_region.value;
      break;
    case 'azure_language':
      value = azure_language.value;
      break;
    case 'whisper_api_key':
      value = whisper_api_key.value;
      break;
    case 'whisper_model':
      value = whisper_model.value;
      break;
    case 'whisper_language':
      value = whisper_language.value;
      break;
    case 'webspeech_language':
      value = webspeech_language.value;
      break;
    case 'webspeech_continuous':
      value = webspeech_continuous.value;
      break;
    case 'webspeech_interim_results':
      value = webspeech_interim_results.value;
      break;
    case 'deepgram_api_key':
      value = deepgram_api_key.value;
      break;
    case 'deepgram_model':
      value = deepgram_model.value;
      break;
    case 'deepgram_language':
      value = deepgram_language.value;
      break;
    default:
      value = null;
  }
  localStorage.setItem(key_name, value);
};

const onTranscriptionProviderChange = value => {
  localStorage.setItem('transcription_provider', value);
};

onMounted(() => {
  // Load settings
  transcription_provider.value = config_util.transcription_provider();

  azure_token.value = config_util.azure_token();
  azure_region.value = config_util.azure_region();
  azure_language.value = config_util.azure_language();

  whisper_api_key.value = config_util.whisper_api_key();
  whisper_model.value = config_util.whisper_model();
  whisper_language.value = config_util.whisper_language();

  webspeech_language.value = config_util.webspeech_language();
  webspeech_continuous.value = config_util.webspeech_continuous();
  webspeech_interim_results.value = config_util.webspeech_interim_results();

  deepgram_api_key.value = config_util.deepgram_api_key();
  deepgram_model.value = config_util.deepgram_model();
  deepgram_language.value = config_util.deepgram_language();
});
</script>

<style scoped>
.speech-settings {
  max-width: 100%;
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

.checkbox-desc {
  font-size: 12px;
  color: #909399;
  margin: 4px 0 0 0;
}
</style>

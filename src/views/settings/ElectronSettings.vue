<template>
  <SettingsLayout>
    <div class="electron-settings">
      <p class="info-text">
        Configure the desktop overlay appearance and behaviour. Settings apply immediately and are
        saved across sessions.
      </p>

      <!-- Appearance -->
      <section class="settings-section">
        <h2>Appearance</h2>
        <p class="section-desc">Controls how transparent and blurred the overlay panels are.</p>

        <div class="form-group">
          <label>Opacity: {{ Math.round(opacity * 100) }}%</label>
          <el-slider
            v-model="opacity"
            :min="0.2"
            :max="1.0"
            :step="0.05"
            :show-tooltip="false"
            style="width: 100%"
            @input="onOpacityChange"
          />
          <p class="field-hint">Lower = more see-through. Most visible in Electron desktop mode.</p>
        </div>

        <div class="form-group">
          <label>Blur: {{ blurAmount }}px</label>
          <el-slider
            v-model="blurAmount"
            :min="0"
            :max="32"
            :step="2"
            :show-tooltip="false"
            style="width: 100%"
            @change="onBlurChange"
          />
          <p class="field-hint">Frosted-glass blur behind panels. 0 = no blur.</p>
        </div>

        <div class="form-group">
          <label>Theme</label>
          <el-radio-group v-model="theme" @change="onThemeChange">
            <el-radio-button label="light">
              <el-icon><Sunny /></el-icon>
              Light
            </el-radio-button>
            <el-radio-button label="dark">
              <el-icon><Moon /></el-icon>
              Dark
            </el-radio-button>
            <el-radio-button label="system">
              <el-icon><Monitor /></el-icon>
              System
            </el-radio-button>
          </el-radio-group>
          <p class="field-hint">
            System theme automatically switches between light and dark based on your OS settings.
          </p>
        </div>

        <div class="form-group">
          <label>Scroll speed: {{ scrollSpeed }}px/s</label>
          <el-slider
            v-model="scrollSpeed"
            :min="20"
            :max="300"
            :step="10"
            :show-tooltip="false"
            style="width: 100%"
            @input="onScrollSpeedChange"
          />
          <p class="field-hint">How fast the AI response auto-scrolls. Lower = easier to read.</p>
        </div>

        <el-button size="small" @click="resetAppearance">Reset to defaults</el-button>
      </section>

      <!-- Window -->
      <section class="settings-section">
        <h2>Window Size</h2>
        <p class="section-desc">Default overlay dimensions when launched in Electron.</p>

        <div class="size-row">
          <div class="form-group">
            <label>Width (px)</label>
            <el-input-number
              v-model="windowWidth"
              :min="320"
              :max="1200"
              :step="20"
              @change="onWindowSizeChange"
            />
          </div>
          <div class="form-group">
            <label>Height (px)</label>
            <el-input-number
              v-model="windowHeight"
              :min="200"
              :max="1200"
              :step="20"
              @change="onWindowSizeChange"
            />
          </div>
        </div>
        <p class="field-hint">Takes effect on next Electron launch.</p>
      </section>

      <!-- Auto Mode -->
      <section class="settings-section">
        <h2>Auto Mode</h2>
        <p class="section-desc">
          Automatically generate AI responses without pressing Ask. Toggle with the ⚡ button on the
          main screen.
        </p>

        <div class="form-group">
          <label>Silence trigger delay: {{ triggerDelay }}ms</label>
          <el-slider
            v-model="triggerDelay"
            :min="500"
            :max="8000"
            :step="250"
            :show-tooltip="false"
            style="width: 100%"
            @change="onAutoSettingsChange"
          />
          <p class="field-hint">
            How long to wait after speech stops before firing AI. Lower = faster but may interrupt
            mid-sentence.
          </p>
        </div>

        <div class="form-group">
          <label
            >Screenshot interval:
            {{ screenshotInterval === 0 ? 'Disabled' : screenshotInterval + 'ms' }}</label
          >
          <el-slider
            v-model="screenshotInterval"
            :min="0"
            :max="30000"
            :step="1000"
            :show-tooltip="false"
            style="width: 100%"
            @change="onAutoSettingsChange"
          />
          <p class="field-hint">
            Capture screen every N ms and respond if content changed. 0 = disabled. Requires Gemini
            or vision-capable model.
          </p>
        </div>

        <div class="form-group">
          <label>Screen change sensitivity: {{ Math.round(diffThreshold * 100) }}%</label>
          <el-slider
            v-model="diffThreshold"
            :min="0.01"
            :max="0.2"
            :step="0.01"
            :show-tooltip="false"
            style="width: 100%"
            @change="onAutoSettingsChange"
          />
          <p class="field-hint">
            Minimum pixel change fraction to trigger a response. Lower = more sensitive.
          </p>
        </div>
      </section>

      <!-- Shortcuts reference -->
      <section class="settings-section">
        <h2>Keyboard Shortcuts</h2>
        <p class="section-desc">Global shortcuts work even when the overlay is hidden.</p>

        <el-table :data="shortcuts" style="width: 100%" size="small">
          <el-table-column prop="keys" label="Shortcut" width="220">
            <template #default="{ row }">
              <code class="shortcut-key">{{ row.keys }}</code>
            </template>
          </el-table-column>
          <el-table-column prop="action" label="Action" />
        </el-table>
      </section>

      <!-- Status -->
      <section class="settings-section">
        <h2>Status</h2>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="App Version">
            <el-tag type="info">{{ appVersion }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Running in Electron">
            <el-tag :type="isElectron ? 'success' : 'info'">
              {{ isElectron ? 'Yes' : 'No — browser mode' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Current opacity">
            {{ Math.round(opacity * 100) }}%
          </el-descriptions-item>
          <el-descriptions-item label="Current blur"> {{ blurAmount }}px </el-descriptions-item>
        </el-descriptions>

        <el-alert
          v-if="!isElectron"
          type="info"
          :closable="false"
          style="margin-top: 16px"
          title="Transparency settings are most effective in Electron desktop mode."
          description="Run `npm run electron:dev:https` to launch the desktop overlay."
        />
      </section>
    </div>
  </SettingsLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import SettingsLayout from './SettingsLayout.vue';
import { useElectron } from '../../composables/useElectron';
import { AUTO_DEFAULTS } from '../../composables/useAutoMode';
import { Sunny, Moon, Monitor } from '@element-plus/icons-vue';
import { getThemePreference, setThemePreference } from '../../utils/theme_util';

const { isElectron } = useElectron();

// ── Keys ──────────────────────────────────────────────────────────────────────
const OPACITY_KEY = 'appearance_opacity';
const BLUR_KEY = 'appearance_blur';
const SCROLL_SPEED_KEY = 'appearance_scroll_speed';
const WIN_WIDTH_KEY = 'electron_win_width';
const WIN_HEIGHT_KEY = 'electron_win_height';
const TRIGGER_DELAY_KEY = 'auto_trigger_delay_ms';
const SCREENSHOT_INTERVAL_KEY = 'auto_screenshot_interval_ms';
const DIFF_THRESHOLD_KEY = 'auto_diff_threshold';

const DEFAULT_OPACITY = 0.72;
const DEFAULT_BLUR = 18;
const DEFAULT_SCROLL_SPEED = 80;
const DEFAULT_WIN_WIDTH = 480;
const DEFAULT_WIN_HEIGHT = 640;

// ── State ─────────────────────────────────────────────────────────────────────
const opacity = ref(DEFAULT_OPACITY);
const blurAmount = ref(DEFAULT_BLUR);
const scrollSpeed = ref(DEFAULT_SCROLL_SPEED);
const windowWidth = ref(DEFAULT_WIN_WIDTH);
const windowHeight = ref(DEFAULT_WIN_HEIGHT);
const theme = ref(getThemePreference());
const appVersion = ref(import.meta.env.VUE_APP_VERSION || '1.0.0');

// Auto mode
const triggerDelay = ref(AUTO_DEFAULTS.triggerDelay);
const screenshotInterval = ref(AUTO_DEFAULTS.screenshotInterval);
const diffThreshold = ref(AUTO_DEFAULTS.diffThreshold);

// ── Shortcuts table ───────────────────────────────────────────────────────────
const shortcuts = [
  { keys: 'Cmd/Ctrl + Shift + Space', action: 'Show / hide overlay' },
  { keys: 'Cmd/Ctrl + ←→↑↓', action: 'Move window 40px' },
  { keys: '⌥M / ⌘M', action: 'Toggle overlay / Picture-in-Picture mode' },
];

// ── Apply ─────────────────────────────────────────────────────────────────────

/**
 * Write CSS variables onto :root so all panels update immediately.
 * Respects the current theme (light/dark) when applying opacity.
 */
function applyAppearance(op, blur) {
  const root = document.documentElement;
  const isDark = root.getAttribute('data-theme') === 'dark';

  if (isDark) {
    // Dark theme base colors with opacity
    root.style.setProperty('--bg-primary', `rgba(30,30,30,${op.toFixed(2)})`);
    root.style.setProperty('--bg-secondary', `rgba(40,40,40,${(op * 0.9).toFixed(2)})`);
    root.style.setProperty('--bg-tertiary', `rgba(50,50,50,${(op * 0.83).toFixed(2)})`);
  } else {
    // Light theme base colors with opacity
    root.style.setProperty('--bg-primary', `rgba(255,255,255,${op.toFixed(2)})`);
    root.style.setProperty('--bg-secondary', `rgba(245,247,250,${(op * 0.9).toFixed(2)})`);
    root.style.setProperty('--bg-tertiary', `rgba(250,250,250,${(op * 0.83).toFixed(2)})`);
  }
  root.style.setProperty('--backdrop-blur', `blur(${blur}px)`);
}

function onOpacityChange(val) {
  localStorage.setItem(OPACITY_KEY, val);
  applyAppearance(val, blurAmount.value);
  if (window.electronAPI?.setOpacity) window.electronAPI.setOpacity(val);
}

function onBlurChange(val) {
  localStorage.setItem(BLUR_KEY, val);
  applyAppearance(opacity.value, val);
}

function onScrollSpeedChange(val) {
  localStorage.setItem(SCROLL_SPEED_KEY, val);
}

function onThemeChange(val) {
  setThemePreference(val);
  // applyAppearance is called via the 'theme-changed' event listener
}

function resetAppearance() {
  opacity.value = DEFAULT_OPACITY;
  blurAmount.value = DEFAULT_BLUR;
  scrollSpeed.value = DEFAULT_SCROLL_SPEED;
  theme.value = 'system';
  localStorage.removeItem(OPACITY_KEY);
  localStorage.removeItem(BLUR_KEY);
  localStorage.removeItem(SCROLL_SPEED_KEY);
  localStorage.removeItem('app_theme');
  applyAppearance(DEFAULT_OPACITY, DEFAULT_BLUR);
  setThemePreference('system');
}

function onWindowSizeChange() {
  localStorage.setItem(WIN_WIDTH_KEY, windowWidth.value);
  localStorage.setItem(WIN_HEIGHT_KEY, windowHeight.value);
}

function onAutoSettingsChange() {
  localStorage.setItem(TRIGGER_DELAY_KEY, triggerDelay.value);
  localStorage.setItem(SCREENSHOT_INTERVAL_KEY, screenshotInterval.value);
  localStorage.setItem(DIFF_THRESHOLD_KEY, diffThreshold.value);
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
const handleThemeChanged = () => applyAppearance(opacity.value, blurAmount.value);

onMounted(() => {
  const savedOpacity = localStorage.getItem(OPACITY_KEY);
  const savedBlur = localStorage.getItem(BLUR_KEY);
  opacity.value = savedOpacity !== null ? parseFloat(savedOpacity) : DEFAULT_OPACITY;
  blurAmount.value = savedBlur !== null ? parseInt(savedBlur) : DEFAULT_BLUR;
  const savedScroll = localStorage.getItem(SCROLL_SPEED_KEY);
  scrollSpeed.value = savedScroll !== null ? parseInt(savedScroll) : DEFAULT_SCROLL_SPEED;
  windowWidth.value = parseInt(localStorage.getItem(WIN_WIDTH_KEY)) || DEFAULT_WIN_WIDTH;
  windowHeight.value = parseInt(localStorage.getItem(WIN_HEIGHT_KEY)) || DEFAULT_WIN_HEIGHT;

  triggerDelay.value =
    parseInt(localStorage.getItem(TRIGGER_DELAY_KEY)) || AUTO_DEFAULTS.triggerDelay;
  screenshotInterval.value =
    parseInt(localStorage.getItem(SCREENSHOT_INTERVAL_KEY)) || AUTO_DEFAULTS.screenshotInterval;
  diffThreshold.value =
    parseFloat(localStorage.getItem(DIFF_THRESHOLD_KEY)) || AUTO_DEFAULTS.diffThreshold;

  // Apply saved appearance on load
  applyAppearance(opacity.value, blurAmount.value);

  // Re-apply appearance when system/manual theme changes
  window.addEventListener('theme-changed', handleThemeChanged);
});

onUnmounted(() => {
  window.removeEventListener('theme-changed', handleThemeChanged);
});
</script>

<style scoped>
.electron-settings {
  max-width: 100%;
}

.info-text {
  color: var(--text-regular);
  font-size: 14px;
  margin-bottom: 32px;
  line-height: 1.6;
}

.settings-section {
  margin-bottom: 40px;
}

.settings-section h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.section-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 16px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.field-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 6px 0 0 0;
}

.size-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.shortcut-key {
  background: var(--bg-secondary);
  border: 1px solid var(--border-base);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 13px;
  font-family: monospace;
}
</style>

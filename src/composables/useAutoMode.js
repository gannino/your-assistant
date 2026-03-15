// ============================================
// useAutoMode — Headless / auto-response composable
//
// Two triggers (both only fire when recording is active):
//   1. Transcript silence — debounced: fires askFn after N ms of no new text
//   2. Screenshot polling — every N ms captures screen; fires askFn only if
//      content changed beyond a threshold (pixel diff)
// ============================================

import { ref, watch } from 'vue';
import { captureScreenshot, imageChangeFraction } from '../utils/screenshot_util';
import config from '../utils/config_util';

// ── Config keys ───────────────────────────────────────────────────────────────
const KEY_AUTO_ENABLED = 'auto_mode_enabled';
const KEY_TRIGGER_DELAY = 'auto_trigger_delay_ms';
const KEY_SCREENSHOT_INTERVAL = 'auto_screenshot_interval_ms';
const KEY_DIFF_THRESHOLD = 'auto_diff_threshold';

export const AUTO_DEFAULTS = {
  triggerDelay: 2500, // ms silence before firing on transcript
  screenshotInterval: 0, // ms between auto-captures (0 = disabled)
  diffThreshold: 0.04, // 4% pixel change = "screen changed"
};

// ── Singleton state ───────────────────────────────────────────────────────────
const isAutoMode = ref(false);
const autoStatus = ref(''); // human-readable status shown in UI

export function useAutoMode() {
  return { isAutoMode, autoStatus, startAutoMode, stopAutoMode, toggleAutoMode, loadSettings };
}

// ── Internal ──────────────────────────────────────────────────────────────────
let _askFn = null; // () => void  — calls HomeView's askCurrentText
let _addScreenshotFn = null; // (dataUrl) => void — pushes into screenshotQueue
let _isRecordingRef = null; // Ref<boolean>
let _transcriptRef = null; // Ref<string>

let _debounceTimer = null;
let _screenshotTimer = null;
let _lastScreenshot = null; // last captured data URL for diff
let _lastTranscript = ''; // last transcript value seen by debounce

function getSettings() {
  return {
    triggerDelay: parseInt(localStorage.getItem(KEY_TRIGGER_DELAY)) || AUTO_DEFAULTS.triggerDelay,
    screenshotInterval:
      parseInt(localStorage.getItem(KEY_SCREENSHOT_INTERVAL)) || AUTO_DEFAULTS.screenshotInterval,
    diffThreshold:
      parseFloat(localStorage.getItem(KEY_DIFF_THRESHOLD)) || AUTO_DEFAULTS.diffThreshold,
  };
}

// ── Transcript debounce watcher ───────────────────────────────────────────────

let _stopTranscriptWatch = null;

function startTranscriptWatcher() {
  if (_stopTranscriptWatch) return;
  _stopTranscriptWatch = watch(_transcriptRef, newVal => {
    if (!isAutoMode.value || !_isRecordingRef?.value) return;
    if (newVal === _lastTranscript) return;
    _lastTranscript = newVal;

    clearTimeout(_debounceTimer);
    autoStatus.value = '⏳ Waiting for pause…';

    const { triggerDelay } = getSettings();
    _debounceTimer = setTimeout(() => {
      if (!isAutoMode.value || !_isRecordingRef?.value) return;
      autoStatus.value = '🤖 Auto-responding…';
      _askFn?.();
    }, triggerDelay);
  });
}

function stopTranscriptWatcher() {
  _stopTranscriptWatch?.();
  _stopTranscriptWatch = null;
  clearTimeout(_debounceTimer);
  _debounceTimer = null;
}

// ── Screenshot polling loop ───────────────────────────────────────────────────

async function screenshotTick() {
  if (!isAutoMode.value || !_isRecordingRef?.value) return;

  try {
    const dataUrl = await captureScreenshot();

    if (_lastScreenshot) {
      const diff = await imageChangeFraction(_lastScreenshot, dataUrl);
      const { diffThreshold } = getSettings();
      if (diff >= diffThreshold) {
        autoStatus.value = `📸 Screen changed (${Math.round(diff * 100)}%) — responding…`;
        _addScreenshotFn?.(dataUrl);
        _askFn?.();
      }
    }

    _lastScreenshot = dataUrl;
  } catch (err) {
    console.warn('[AutoMode] Screenshot tick failed:', err.message);
  }
}

function startScreenshotLoop() {
  stopScreenshotLoop();
  const { screenshotInterval } = getSettings();
  if (!screenshotInterval) return;

  // Capture an initial baseline immediately
  captureScreenshot()
    .then(url => {
      _lastScreenshot = url;
    })
    .catch(() => {});

  _screenshotTimer = setInterval(screenshotTick, screenshotInterval);
}

function stopScreenshotLoop() {
  if (_screenshotTimer) {
    clearInterval(_screenshotTimer);
    _screenshotTimer = null;
  }
  _lastScreenshot = null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * @param {Object} opts
 * @param {Function} opts.askFn           - calls askCurrentText()
 * @param {Function} opts.addScreenshotFn - pushes a dataUrl into screenshotQueue
 * @param {import('vue').Ref} opts.isRecordingRef
 * @param {import('vue').Ref} opts.transcriptRef
 */
export function startAutoMode({ askFn, addScreenshotFn, isRecordingRef, transcriptRef }) {
  _askFn = askFn;
  _addScreenshotFn = addScreenshotFn;
  _isRecordingRef = isRecordingRef;
  _transcriptRef = transcriptRef;
  _lastTranscript = transcriptRef.value;

  isAutoMode.value = true;
  autoStatus.value = '🟢 Auto mode active';
  localStorage.setItem(KEY_AUTO_ENABLED, '1');

  startTranscriptWatcher();
  startScreenshotLoop();
}

export function stopAutoMode() {
  isAutoMode.value = false;
  autoStatus.value = '';
  localStorage.removeItem(KEY_AUTO_ENABLED);

  stopTranscriptWatcher();
  stopScreenshotLoop();
  clearTimeout(_debounceTimer);
  _debounceTimer = null;
}

export function toggleAutoMode(opts) {
  if (isAutoMode.value) {
    stopAutoMode();
  } else {
    startAutoMode(opts);
  }
}

export function loadSettings() {
  return getSettings();
}

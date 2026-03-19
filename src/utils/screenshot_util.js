// ============================================
// Screenshot Utility
// In Electron: uses desktopCapturer via IPC — silent, no picker.
// In browser:  falls back to getDisplayMedia (user picks screen once).
// ============================================

let activeStream = null; // browser fallback stream

// ── Electron path ─────────────────────────────────────────────────────────────

/**
 * Capture the primary screen silently via Electron desktopCapturer.
 * @param {string} [sourceId] - Optional specific source id from getCaptureSources()
 * @returns {Promise<string>} Base64 PNG data URL
 */
export async function captureScreenElectron(sourceId) {
  return window.electronAPI.captureScreen(sourceId || null);
}

/**
 * Capture via screenshot-desktop (hides overlay, no picker, no overlay in image).
 * Only available in Electron.
 * @returns {Promise<string>} Base64 PNG data URL
 */
export async function takeScreenshotElectron() {
  return window.electronAPI.takeScreenshot();
}

/**
 * List all capturable screens and windows (Electron only).
 * @returns {Promise<Array<{id, name, thumbnail}>>}
 */
export async function getCaptureSources() {
  if (!window.electronAPI?.getCaptureSources) return [];
  return window.electronAPI.getCaptureSources(['screen', 'window']);
}

// ── Browser fallback path ─────────────────────────────────────────────────────

async function captureScreenBrowser() {
  if (!activeStream || !activeStream.active) {
    activeStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'never' },
      audio: false,
    });
    activeStream.getVideoTracks()[0].addEventListener('ended', () => {
      activeStream = null;
    });
  }

  const track = activeStream.getVideoTracks()[0];
  const imageCapture = new ImageCapture(track);
  const bitmap = await imageCapture.grabFrame();

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0);
  return canvas.toDataURL('image/png');
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Capture a screenshot. Uses Electron desktopCapturer when available (silent,
 * no picker), otherwise falls back to getDisplayMedia.
 * @param {string} [sourceId] - Electron only: specific source id
 * @returns {Promise<string>} Base64 PNG data URL
 */
export async function captureScreenshot(sourceId) {
  try {
    if (window.electronAPI?.takeScreenshot) {
      return await takeScreenshotElectron();
    }
    if (window.electronAPI?.captureScreen) {
      return await captureScreenElectron(sourceId);
    }
    return await captureScreenBrowser();
  } catch (error) {
    activeStream = null;
    throw new Error(`Screenshot failed: ${error.message}`);
  }
}

/**
 * Stop the browser fallback stream (no-op in Electron).
 */
export function stopScreenCapture() {
  if (activeStream) {
    activeStream.getTracks().forEach(t => t.stop());
    activeStream = null;
  }
}

/**
 * @returns {boolean}
 */
export function isScreenCaptureSupported() {
  if (window.electronAPI?.captureScreen) return true;
  return !!(navigator.mediaDevices?.getDisplayMedia && window.ImageCapture);
}

// ── Pixel diff helper (for auto-mode change detection) ────────────────────────

/**
 * Compare two base64 PNG data URLs by downsampling to 32×32 and summing pixel deltas.
 * Returns a value 0–1 where 0 = identical, 1 = completely different.
 * @param {string} dataUrlA
 * @param {string} dataUrlB
 * @returns {Promise<number>}
 */
export async function imageChangeFraction(dataUrlA, dataUrlB) {
  const SIZE = 32;

  async function toPixels(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        canvas.getContext('2d').drawImage(img, 0, 0, SIZE, SIZE);
        resolve(canvas.getContext('2d').getImageData(0, 0, SIZE, SIZE).data);
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  const [a, b] = await Promise.all([toPixels(dataUrlA), toPixels(dataUrlB)]);
  let delta = 0;
  for (let i = 0; i < a.length; i += 4) {
    delta += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
  }
  // Max possible delta: SIZE*SIZE pixels × 3 channels × 255
  return delta / (SIZE * SIZE * 3 * 255);
}

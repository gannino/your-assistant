// ============================================
// useOverlayMode — Mini / Overlay mode composable
//
// Two modes:
//   1. Document Picture-in-Picture (Chrome 116+) — true floating window
//   2. CSS mini-mode fallback — fixed overlay panel inside the same tab
// ============================================

import { ref, readonly } from 'vue';

const isMiniMode = ref(false);
const isPiPActive = ref(false);
let pipWindow = null;

/**
 * Check if Document Picture-in-Picture is supported.
 * @returns {boolean}
 */
export function isPiPSupported() {
  return 'documentPictureInPicture' in window;
}

/**
 * Toggle mini/overlay mode.
 * Tries Document PiP first; falls back to CSS fixed overlay.
 * @param {HTMLElement} contentEl - The element to move into the PiP window
 */
export async function toggleOverlayMode(contentEl) {
  if (isMiniMode.value) {
    await exitOverlayMode();
  } else {
    await enterOverlayMode(contentEl);
  }
}

async function enterOverlayMode(contentEl) {
  if (isPiPSupported() && contentEl) {
    try {
      pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 420,
        height: 560,
      });

      // Copy styles into PiP window
      [...document.styleSheets].forEach(sheet => {
        try {
          const cssRules = [...sheet.cssRules].map(r => r.cssText).join('');
          const style = pipWindow.document.createElement('style');
          style.textContent = cssRules;
          pipWindow.document.head.appendChild(style);
        } catch {
          // Cross-origin sheets — skip
        }
      });

      pipWindow.document.body.appendChild(contentEl);
      pipWindow.document.body.style.margin = '0';
      pipWindow.document.body.style.overflow = 'hidden';

      pipWindow.addEventListener('pagehide', () => {
        // User closed the PiP window
        document.body.appendChild(contentEl);
        isMiniMode.value = false;
        isPiPActive.value = false;
        pipWindow = null;
      });

      isPiPActive.value = true;
      isMiniMode.value = true;
      return;
    } catch (err) {
      console.warn('[Overlay] PiP failed, falling back to CSS mini-mode:', err.message);
    }
  }

  // CSS fallback
  isMiniMode.value = true;
}

async function exitOverlayMode() {
  if (pipWindow) {
    pipWindow.close();
    pipWindow = null;
    isPiPActive.value = false;
  }
  isMiniMode.value = false;
}

/**
 * Register Alt+M global shortcut to toggle overlay mode.
 * Call once from App.vue onMounted.
 * @param {Function} toggleFn - The toggle function to call
 */
export function registerOverlayShortcut(toggleFn) {
  const handler = e => {
    if ((e.altKey || e.metaKey) && e.key === 'm') {
      e.preventDefault();
      toggleFn();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}

export const overlayState = {
  isMiniMode: readonly(isMiniMode),
  isPiPActive: readonly(isPiPActive),
};

/**
 * Theme utility for managing light/dark/system theme preferences
 */

const THEME_STORAGE_KEY = 'app_theme';

// Theme options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

/**
 * Get the saved theme preference from localStorage
 * @returns {string} Theme preference ('light', 'dark', or 'system')
 */
export function getThemePreference() {
  return localStorage.getItem(THEME_STORAGE_KEY) || THEMES.SYSTEM;
}

/**
 * Save theme preference to localStorage
 * @param {string} theme - Theme preference ('light', 'dark', or 'system')
 */
export function setThemePreference(theme) {
  if (!Object.values(THEMES).includes(theme)) {
    console.warn(`[Theme] Invalid theme value: ${theme}`);
    return;
  }
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

/**
 * Detect system theme preference
 * @returns {string} 'light' or 'dark' based on system preference
 */
export function getSystemTheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return THEMES.DARK;
  }
  return THEMES.LIGHT;
}

/**
 * Get the effective theme (resolves 'system' to actual theme)
 * @returns {string} 'light' or 'dark'
 */
export function getEffectiveTheme() {
  const preference = getThemePreference();
  if (preference === THEMES.SYSTEM) {
    return getSystemTheme();
  }
  return preference;
}

/**
 * Apply theme to document root
 * @param {string} themePreference - Theme preference ('light', 'dark', or 'system')
 */
export function applyTheme(themePreference) {
  const effectiveTheme = themePreference === THEMES.SYSTEM ? getSystemTheme() : themePreference;

  const root = document.documentElement;

  if (effectiveTheme === THEMES.DARK) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.setAttribute('data-theme', 'light');
  }

  // Notify listeners (e.g. ElectronSettings) so they can re-apply opacity/blur
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: effectiveTheme } }));

  console.log(`[Theme] Applied theme: ${effectiveTheme} (preference: ${themePreference})`);
}

/**
 * Initialize theme system
 * Should be called on app mount
 */
export function initializeTheme() {
  const preference = getThemePreference();
  applyTheme(preference);

  // Listen for system theme changes if using system preference
  if (preference === THEMES.SYSTEM && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => applyTheme(THEMES.SYSTEM);
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Return cleanup function
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }

  return () => {};
}

/**
 * Get theme label for display
 * @param {string} theme - Theme value
 * @returns {string} Human-readable theme name
 */
export function getThemeLabel(theme) {
  const labels = {
    [THEMES.LIGHT]: 'Light',
    [THEMES.DARK]: 'Dark',
    [THEMES.SYSTEM]: 'System',
  };
  return labels[theme] || theme;
}

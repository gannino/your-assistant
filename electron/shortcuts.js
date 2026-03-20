const { globalShortcut } = require('electron');

let registered = false;

/**
 * Register all global shortcuts.
 * @param {{ toggleVisibility, moveWindow, takeScreenshot, toggleDevTools }} handlers
 */
function registerShortcuts({ toggleVisibility, moveWindow, takeScreenshot, toggleDevTools }) {
  if (registered) return;

  // Show / hide overlay
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    try {
      toggleVisibility();
    } catch (err) {
      console.error('[Shortcuts] toggleVisibility error:', err);
    }
  });

  // Take a screenshot (hide overlay, capture, restore)
  globalShortcut.register('CommandOrControl+H', () => {
    takeScreenshot().catch(err => {
      console.error('[Shortcuts] takeScreenshot error:', err);
    });
  });

  // Toggle DevTools
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    try {
      toggleDevTools();
    } catch (err) {
      console.error('[Shortcuts] toggleDevTools error:', err);
    }
  });

  // Move window with arrow keys
  globalShortcut.register('CommandOrControl+Left', () => {
    try {
      moveWindow(-40, 0);
    } catch (err) {
      console.error('[Shortcuts] moveWindow error:', err);
    }
  });
  globalShortcut.register('CommandOrControl+Right', () => {
    try {
      moveWindow(40, 0);
    } catch (err) {
      console.error('[Shortcuts] moveWindow error:', err);
    }
  });
  globalShortcut.register('CommandOrControl+Up', () => {
    try {
      moveWindow(0, -40);
    } catch (err) {
      console.error('[Shortcuts] moveWindow error:', err);
    }
  });
  globalShortcut.register('CommandOrControl+Down', () => {
    try {
      moveWindow(0, 40);
    } catch (err) {
      console.error('[Shortcuts] moveWindow error:', err);
    }
  });

  registered = true;
  console.log('[Shortcuts] Global shortcuts registered');
}

function unregisterShortcuts() {
  globalShortcut.unregisterAll();
  registered = false;
}

module.exports = { registerShortcuts, unregisterShortcuts };

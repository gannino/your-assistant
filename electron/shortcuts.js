const { globalShortcut } = require('electron');

let registered = false;

/**
 * Register all global shortcuts.
 * @param {{ toggleVisibility, moveWindow, takeScreenshot }} handlers
 */
function registerShortcuts({ toggleVisibility, moveWindow, takeScreenshot }) {
  if (registered) return;

  // Show / hide overlay
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    toggleVisibility();
  });

  // Take a screenshot (hide overlay, capture, restore)
  globalShortcut.register('CommandOrControl+H', () => {
    takeScreenshot();
  });

  // Move window with arrow keys
  globalShortcut.register('CommandOrControl+Left',  () => moveWindow(-40, 0));
  globalShortcut.register('CommandOrControl+Right', () => moveWindow(40, 0));
  globalShortcut.register('CommandOrControl+Up',    () => moveWindow(0, -40));
  globalShortcut.register('CommandOrControl+Down',  () => moveWindow(0, 40));

  registered = true;
  console.log('[Shortcuts] Global shortcuts registered');
}

function unregisterShortcuts() {
  globalShortcut.unregisterAll();
  registered = false;
}

module.exports = { registerShortcuts, unregisterShortcuts };

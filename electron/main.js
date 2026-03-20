const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  screen,
  desktopCapturer,
} = require('electron');
const path = require('path');
const screenshot = require('screenshot-desktop');
const { registerShortcuts, unregisterShortcuts } = require('./shortcuts');

// Global unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Electron] Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, show error to user and continue
  if (process.env.NODE_ENV !== 'development') {
    console.error('[Electron] Unhandled promise rejection. This should be fixed!');
    // Don't crash, just log and continue
  }
});

// Global uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('[Electron] Uncaught Exception:', error);
  // In production, show error dialog but try to continue
  if (process.env.NODE_ENV !== 'development') {
    console.error('[Electron] Uncaught exception. This should be fixed!');
    // Don't crash, just log and continue
  }
});

const isDev = process.env.NODE_ENV === 'development';
const DEV_URL =
  process.env.VUE_APP_HTTPS === 'true' ? 'https://localhost:8080' : 'http://localhost:8080';

// In production, load from the dist directory
// In Electron apps, __dirname is inside the app.asar archive
// The dist folder should be at the same level as the electron folder
const PROD_FILE = path.join(__dirname, '../dist/index.html');

const OVERLAY_WIDTH = 1920;
const OVERLAY_HEIGHT = 1080;
const MINI_HEIGHT = 200;

let mainWindow = null;
let tray = null;

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow() {
  const windowOptions = {
    width: OVERLAY_WIDTH,
    height: OVERLAY_HEIGHT,
    center: true,

    transparent: true,
    frame: false,
    backgroundColor: '#00000000',

    alwaysOnTop: true,
    level: 'floating',
    skipTaskbar: true,

    resizable: true,
    movable: true,
    minimizable: false,
    maximizable: false,
    show: false,

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  };

  // Platform-specific adjustments
  if (process.platform === 'darwin') {
    // macOS-specific settings
    windowOptions.titleBarStyle = 'hidden';
  } else if (process.platform === 'win32') {
    // Windows-specific settings
    windowOptions.skipTaskbar = false;
  }

  mainWindow = new BrowserWindow(windowOptions);

  // Open DevTools in development for debugging (controlled by environment variable)
  if (isDev && process.env.OPEN_DEVTOOLS === 'true') {
    mainWindow.webContents.openDevTools();
  }

  if (isDev) {
    console.log('[Electron] Loading dev URL:', DEV_URL);
    mainWindow.loadURL(DEV_URL).catch(err => {
      console.error('[Electron] Failed to load dev URL:', err);
    });
  } else {
    console.log('[Electron] Loading prod file:', PROD_FILE);
    console.log('[Electron] __dirname:', __dirname);
    console.log('[Electron] File exists:', require('fs').existsSync(PROD_FILE));

    mainWindow.loadFile(PROD_FILE).catch(err => {
      console.error('[Electron] Failed to load prod file:', err);
      // Try loading from alternative locations
      const alternatives = [
        path.join(process.resourcesPath, 'app', 'dist', 'index.html'),
        path.join(process.resourcesPath, 'dist', 'index.html'),
        path.join(__dirname, '..', 'dist', 'index.html'),
      ];

      for (const altPath of alternatives) {
        console.log('[Electron] Trying alternative path:', altPath);
        if (require('fs').existsSync(altPath)) {
          console.log('[Electron] Found file at:', altPath);
          mainWindow.loadFile(altPath).catch(e => {
            console.error('[Electron] Failed to load alternative:', e);
          });
          return;
        }
      }

      // If all paths fail, show error to user
      console.error('[Electron] Could not find index.html in any location');
      mainWindow.webContents.loadURL('about:blank').then(() => {
        mainWindow.webContents.executeJavaScript(`
          document.body.style.fontFamily = 'sans-serif';
          document.body.style.padding = '20px';
          document.body.style.backgroundColor = '#1a1a1a';
          document.body.style.color = '#fff';
          document.body.innerHTML = '<h2>Error Loading Application</h2><p>Could not find application files. Please reinstall the application.</p>';
        `);
      });
    });
  }

  // Log page loading events for debugging
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('[Electron] Page started loading');
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron] Page finished loading');
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('[Electron] Page failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('blur', () => {
    mainWindow.setAlwaysOnTop(true, 'floating');
  });

  mainWindow.once('ready-to-show', () => {
    console.log('[Electron] Window ready to show');
    // Window starts hidden — user shows it via tray or Cmd+Shift+Space
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── Tray ──────────────────────────────────────────────────────────────────────

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  if (process.platform === 'darwin') tray.setTitle('YA');
  tray.setToolTip('Your Assistant — Cmd+Shift+Space to show');

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show / Hide', click: toggleVisibility },
      { type: 'separator' },
      { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
    ])
  );

  tray.on('double-click', toggleVisibility);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toggleVisibility() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

function moveWindow(dx, dy) {
  if (!mainWindow) return;
  const [x, y] = mainWindow.getPosition();
  mainWindow.setPosition(x + dx, y + dy);
}

async function takeScreenshot() {
  if (!mainWindow) return;
  const wasVisible = mainWindow.isVisible();
  if (wasVisible) mainWindow.hide();
  await new Promise(resolve => setTimeout(resolve, 150));
  try {
    const imgBuffer = await screenshot({ format: 'png' });
    const dataUrl = `data:image/png;base64,${imgBuffer.toString('base64')}`;
    mainWindow.webContents.send('screenshot-taken', dataUrl);
  } catch (err) {
    console.error('[Screenshot] Failed:', err.message);
    // Send error to renderer process
    mainWindow.webContents.send('screenshot-error', err.message);
  } finally {
    if (wasVisible) mainWindow.show();
  }
}

// ── IPC ───────────────────────────────────────────────────────────────────────

ipcMain.on('hide-window', () => mainWindow?.hide());
ipcMain.on('move-window', (_, { dx, dy }) => moveWindow(dx, dy));
ipcMain.on('set-window-size', (_, { width, height }) => {
  if (mainWindow) mainWindow.setSize(width, height, true);
});
ipcMain.on('set-opacity', (_, opacity) => {
  if (mainWindow) mainWindow.setOpacity(Math.max(0.1, Math.min(1.0, opacity)));
});

// Take a screenshot via screenshot-desktop (hides overlay, captures, restores)
ipcMain.handle('take-screenshot', async () => {
  if (!mainWindow) {
    throw new Error('Main window not available');
  }

  const wasVisible = mainWindow.isVisible();
  if (wasVisible) mainWindow.hide();
  await new Promise(resolve => setTimeout(resolve, 150));

  try {
    const imgBuffer = await screenshot({ format: 'png' });
    return `data:image/png;base64,${imgBuffer.toString('base64')}`;
  } catch (err) {
    console.error('[Screenshot] Failed to capture:', err);
    throw new Error(`Screenshot failed: ${err.message}`);
  } finally {
    if (wasVisible) mainWindow.show();
  }
});

// Auto-resize window height to fit content
ipcMain.on('set-content-height', (_, height) => {
  if (!mainWindow) return;
  const [w] = mainWindow.getSize();
  const { workAreaSize } = screen.getPrimaryDisplay();
  const clamped = Math.min(Math.max(height, MINI_HEIGHT), workAreaSize.height - 40);
  mainWindow.setSize(w, Math.ceil(clamped), true);
});

// Returns list of capturable sources (screens + windows)
ipcMain.handle('get-capture-sources', async (_, types = ['screen', 'window']) => {
  const sources = await desktopCapturer.getSources({
    types,
    thumbnailSize: { width: 320, height: 180 },
  });
  return sources.map(s => ({
    id: s.id,
    name: s.name,
    thumbnail: s.thumbnail.toDataURL(),
  }));
});

// Capture a frame from a specific source (or primary screen by default)
ipcMain.handle('capture-screen', async (_, sourceId) => {
  let id = sourceId;
  if (!id) {
    // Auto-pick the primary display
    const primaryDisplay = screen.getPrimaryDisplay();
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: primaryDisplay.size.width,
        height: primaryDisplay.size.height,
      },
    });
    // Match by display id or fall back to first screen source
    const match = sources.find(s => s.display_id === String(primaryDisplay.id)) || sources[0];
    if (!match) throw new Error('No screen source found');
    id = match.id;
    // Return the high-res thumbnail directly
    const hqSources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: primaryDisplay.size.width,
        height: primaryDisplay.size.height,
      },
    });
    const hq = hqSources.find(s => s.id === id) || hqSources[0];
    return hq.thumbnail.toDataURL();
  }
  // Caller supplied a specific sourceId
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 1920, height: 1080 },
  });
  const src = sources.find(s => s.id === id);
  if (!src) throw new Error(`Source ${id} not found`);
  return src.thumbnail.toDataURL();
});

// ── App lifecycle ─────────────────────────────────────────────────────────────

// Trust self-signed localhost cert — must be registered before app.whenReady()
app.on('certificate-error', (event, _webContents, url, _error, _cert, callback) => {
  if (url.startsWith('https://localhost') || url.startsWith('https://127.0.0.1')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

app.whenReady().then(() => {
  if (process.platform === 'darwin') app.dock?.hide();

  // Enable media devices for macOS
  app.commandLine.appendSwitch('disable-background-timer-throttling');
  app.commandLine.appendSwitch('enable-media-stream');
  app.commandLine.appendSwitch('enable-usermedia-screen-capture');
  app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService');

  // Access session from within app context
  const { session } = require('electron');

  // Set up permission handlers for media devices
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowedPermissions = ['media', 'mediaKeySystem', 'fullscreen', 'notifications'];
    if (allowedPermissions.includes(permission)) {
      callback(true); // Allow all media and notification permissions
    } else {
      callback(false); // Deny other permissions
    }
  });

  // Set up permission check handler
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    if (permission === 'media') {
      return true; // Allow media access
    }
    return false;
  });

  // Platform-specific initialization
  if (process.platform === 'win32') {
    // Windows-specific: ensure shortcuts work properly
    app.setAppUserModelId('com.yourassistant.app');
  }

  createWindow();
  createTray();
  registerShortcuts({ toggleVisibility, moveWindow, takeScreenshot });
}).catch(err => {
  console.error('[Electron] app.whenReady() failed:', err);
  process.exit(1);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});

app.on('will-quit', () => {
  unregisterShortcuts();
});

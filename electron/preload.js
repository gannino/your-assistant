const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  hideWindow:    () => ipcRenderer.send('hide-window'),
  moveWindow:    (dx, dy) => ipcRenderer.send('move-window', { dx, dy }),
  setWindowSize: (width, height) => ipcRenderer.send('set-window-size', { width, height }),
  setOpacity:    (opacity) => ipcRenderer.send('set-opacity', opacity),

  // Screen capture (Electron-native, no picker)
  getCaptureSources: (types) => ipcRenderer.invoke('get-capture-sources', types),
  captureScreen:     (sourceId) => ipcRenderer.invoke('capture-screen', sourceId),
  takeScreenshot:    () => ipcRenderer.invoke('take-screenshot'),

  // Auto-resize window to content
  setContentHeight:  (height) => ipcRenderer.send('set-content-height', height),

  // Listen for main-process events
  onScreenshotTaken: callback => {
    ipcRenderer.on('screenshot-taken', (_, dataUrl) => callback(dataUrl));
    return () => ipcRenderer.removeAllListeners('screenshot-taken');
  },

  // Detect we're running inside Electron
  isElectron: true,
});

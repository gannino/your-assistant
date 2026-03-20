const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  hideWindow: () => ipcRenderer.send('hide-window'),
  moveWindow: (dx, dy) => ipcRenderer.send('move-window', { dx, dy }),
  setWindowSize: (width, height) => ipcRenderer.send('set-window-size', { width, height }),
  setOpacity: opacity => ipcRenderer.send('set-opacity', opacity),

  // Screen capture (Electron-native, no picker)
  getCaptureSources: types => ipcRenderer.invoke('get-capture-sources', types),
  captureScreen: sourceId => ipcRenderer.invoke('capture-screen', sourceId),
  takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),

  // Auto-resize window to content
  setContentHeight: height => ipcRenderer.send('set-content-height', height),

  // Listen for main-process events
  onScreenshotTaken: callback => {
    const handler = (_, dataUrl) => callback(dataUrl);
    ipcRenderer.on('screenshot-taken', handler);
    return () => ipcRenderer.removeListener('screenshot-taken', handler);
  },

  // Listen for screenshot errors
  onScreenshotError: callback => {
    const handler = (_, error) => callback(error);
    ipcRenderer.on('screenshot-error', handler);
    return () => ipcRenderer.removeListener('screenshot-error', handler);
  },

  // Detect we're running inside Electron
  isElectron: true,
});

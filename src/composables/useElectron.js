// ============================================
// useElectron — detect Electron context and
// expose IPC helpers to Vue components
// ============================================

export function useElectron() {
  const isElectron = !!window.electronAPI?.isElectron;

  const hideWindow = () => {
    if (typeof window.electronAPI?.hideWindow === 'function') {
      window.electronAPI.hideWindow();
    }
  };

  const moveWindow = (dx, dy) => {
    if (typeof window.electronAPI?.moveWindow === 'function') {
      window.electronAPI.moveWindow(dx, dy);
    }
  };

  return { isElectron, hideWindow, moveWindow };
}

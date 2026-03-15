// ============================================
// useElectron — detect Electron context and
// expose IPC helpers to Vue components
// ============================================

export function useElectron() {
  const isElectron = !!window.electronAPI?.isElectron;

  const hideWindow = () => window.electronAPI?.hideWindow();
  const moveWindow = (dx, dy) => window.electronAPI?.moveWindow(dx, dy);

  return { isElectron, hideWindow, moveWindow };
}

const { contextBridge, ipcRenderer } = require('electron');

// Preload runs in an isolated context: only expose a minimal, safe bridge.
// No ipcMain here — that belongs to the main process.
contextBridge.exposeInMainWorld('electron', {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    onMaximized: (cb) => ipcRenderer.on('window:maximized', cb),
    onUnmaximized: (cb) => ipcRenderer.on('window:unmaximized', cb),
  },
});

const { contextBridge, ipcRenderer, ipcMain } = require('electron');

// Minimal bridge: only native window controls.
// Business data is served by the local mock service layer inside the renderer,
// so no DB/IPC data channel is needed for local operation.
contextBridge.exposeInMainWorld('electron', {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    onMaximized: (cb) => ipcRenderer.on('window:maximized', cb),
    onUnmaximized: (cb) => ipcRenderer.on('window:unmaximized', cb),
  },
});

ipcMain.handle('window:minimize', (e) => e.sender.minimize());
ipcMain.handle('window:maximize', (e) => {
  const w = e.sender.getOwnerBrowserWindow();
  if (w.isMaximized()) w.unmaximize();
  else w.maximize();
});
ipcMain.handle('window:close', (e) => e.sender.getOwnerBrowserWindow().close());

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

class MainProcess {
  constructor() {
    this.mainWindow = null;
  }

  registerIpc() {
    ipcMain.handle('window:minimize', (e) => e.sender.minimize());
    ipcMain.handle('window:maximize', (e) => {
      const w = e.sender.getOwnerBrowserWindow();
      if (w.isMaximized()) w.unmaximize();
      else w.maximize();
    });
    ipcMain.handle('window:close', (e) => e.sender.getOwnerBrowserWindow().close());
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 900,
      minHeight: 600,
      frame: false,
      backgroundColor: '#1e1e1e',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    this.mainWindow.on('maximize', () =>
      this.mainWindow.webContents.send('window:maximized')
    );
    this.mainWindow.on('unmaximize', () =>
      this.mainWindow.webContents.send('window:unmaximized')
    );
  }

  init() {
    app.whenReady().then(() => {
      this.registerIpc();
      this.createWindow();
      app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
      });
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) this.createWindow();
      });
    });
  }
}

new MainProcess().init();

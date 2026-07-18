const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

class MainProcess {
  constructor() {
    this.mainWindow = null;
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

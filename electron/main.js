const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

const db = require('./services/databaseManager');
const fileSystem = require('./services/fileSystem');
const { registerHandlers, getThemeManager } = require('./ipc');

class MainProcess {
  constructor() {
    this.mainWindow = null;
    this.themeManager = null;
  }

  async initializeServices() {
    await db.initialize();
    await fileSystem.initialize();
    this.themeManager = getThemeManager();
    await this.themeManager.initializeSettings();
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      frame: false,
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

    // Window-scoped state events only.
    this.mainWindow.on('maximize', () =>
      this.mainWindow.webContents.send('window:maximized')
    );
    this.mainWindow.on('unmaximize', () =>
      this.mainWindow.webContents.send('window:unmaximized')
    );
  }

  async init() {
    await app.whenReady();

    // Register ALL IPC handlers exactly once, before any window exists.
    registerHandlers();

    this.createWindow();
    await this.initializeServices();

    app.on('window-all-closed', async () => {
      if (process.platform !== 'darwin') {
        await db.close();
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }
}

const mainProcess = new MainProcess();
mainProcess.init().catch((err) => {
  console.error('Failed to initialize application:', err);
  app.quit();
});

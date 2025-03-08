const { BrowserWindow, screen } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

class MainWindow {
    constructor() {
        this.window = null;
    }

    create() {
        // Get screen size
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;

        this.window = new BrowserWindow({
            width: Math.min(1280, width * 0.8),
            height: Math.min(800, height * 0.8),
            minWidth: 800,
            minHeight: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true,
                preload: path.join(__dirname, '../../preload.js')
            },
            backgroundColor: '#1e1e1e',
            titleBarStyle: 'hidden',
            titleBarOverlay: {
                color: '#1e1e1e',
                symbolColor: '#ffffff'
            },
            show: false
        });

        // Load the app
        const startUrl = isDev 
            ? 'http://localhost:3000' 
            : `file://${path.join(__dirname, '../../build/index.html')}`;

        console.log('Loading URL:', startUrl);
        this.window.loadURL(startUrl);

        // Window state management
        this.window.on('maximize', () => {
            this.window.webContents.send('window:maximized');
        });

        this.window.on('unmaximize', () => {
            this.window.webContents.send('window:unmaximized');
        });

        return this.window;
    }
}

module.exports = MainWindow;

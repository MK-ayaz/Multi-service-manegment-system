const { ipcMain, nativeTheme } = require('electron');
const db = require('./databaseManager.js');

class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.initializeSettings();
    this.setupIpcHandlers();
  }

  async initializeSettings() {
    // Create settings table if it doesn't exist
    await db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Initialize default settings
    const defaultSettings = {
      darkMode: false,
      notifications: true,
      autoBackup: true,
      language: 'en',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      backupLocation: 'C:/backups',
    };

    // Insert default settings if they don't exist
    for (const [key, value] of Object.entries(defaultSettings)) {
      await db.run(
        'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
        [key, JSON.stringify(value)]
      );
    }
  }

  setupIpcHandlers() {
    // Get all settings
    ipcMain.handle('settings:get', async () => {
      const settings = {};
      const rows = await db.all('SELECT key, value FROM settings');
      for (const row of rows) {
        settings[row.key] = JSON.parse(row.value);
      }
      return settings;
    });

    // Save settings
    ipcMain.handle('settings:save', async (_, settings) => {
      for (const [key, value] of Object.entries(settings)) {
        await db.run(
          'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
          [key, JSON.stringify(value)]
        );
      }
      return true;
    });

    // Get specific setting
    ipcMain.handle('settings:getSetting', async (_, key) => {
      const row = await db.get(
        'SELECT value FROM settings WHERE key = ?',
        [key]
      );
      return row ? JSON.parse(row.value) : null;
    });

    // Set specific setting
    ipcMain.handle('settings:setSetting', async (_, { key, value }) => {
      await db.run(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, JSON.stringify(value)]
      );
      return true;
    });

    // Theme handlers
    ipcMain.handle('theme:get', () => {
      return this.getTheme();
    });

    ipcMain.handle('theme:set', (_, theme) => {
      this.setTheme(theme);
      return true;
    });

    ipcMain.handle('theme:toggle', () => {
      return this.toggleTheme();
    });
  }

  async setTheme(theme) {
    this.currentTheme = theme;
    nativeTheme.themeSource = theme;
    await db.run(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      ['darkMode', JSON.stringify(theme === 'dark')]
    );
  }

  getTheme() {
    return this.currentTheme;
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  }
}

module.exports = ThemeManager; 
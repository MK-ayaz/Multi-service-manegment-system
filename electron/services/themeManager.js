const { nativeTheme } = require('electron');
const db = require('./databaseManager.js');

class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
  }

  async initializeSettings() {
    await db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    const defaultSettings = {
      darkMode: false,
      notifications: true,
      autoBackup: true,
      language: 'en',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      backupLocation: 'C:/backups',
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      await db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [
        key,
        JSON.stringify(value),
      ]);
    }

    const row = await db.get("SELECT value FROM settings WHERE key = 'darkMode'");
    if (row) {
      const dark = JSON.parse(row.value);
      this.currentTheme = dark ? 'dark' : 'light';
      nativeTheme.themeSource = this.currentTheme;
    }
  }

  async setTheme(theme) {
    this.currentTheme = theme;
    nativeTheme.themeSource = theme;
    await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      'darkMode',
      JSON.stringify(theme === 'dark'),
    ]);
    return theme;
  }

  getTheme() {
    return this.currentTheme;
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    return this.setTheme(newTheme);
  }
}

module.exports = ThemeManager;

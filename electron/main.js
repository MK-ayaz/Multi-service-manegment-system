const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Import services
const db = require('./services/databaseManager');
const ThemeManager = require('./services/themeManager');
const fileSystem = require('./services/fileSystem');
const processManager = require('./services/processManager');
const projectManager = require('./services/projectManager');

class MainProcess {
  constructor() {
    this.mainWindow = null;
    this.services = {};
  }

  async initializeServices() {
    // Initialize services
    await db.initialize();
    await fileSystem.initialize();

    this.services.themeManager = new ThemeManager();
    processManager.setMainWindow(this.mainWindow);
    projectManager.setMainWindow(this.mainWindow);
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      frame: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    // Load the app
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Window control handlers
    ipcMain.handle('window:minimize', () => {
      this.mainWindow.minimize();
    });

    ipcMain.handle('window:maximize', () => {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow.maximize();
      }
    });

    ipcMain.handle('window:close', () => {
      this.mainWindow.close();
    });

    // Window state events
    this.mainWindow.on('maximize', () => {
      this.mainWindow.webContents.send('window:maximized');
    });

    this.mainWindow.on('unmaximize', () => {
      this.mainWindow.webContents.send('window:unmaximized');
    });
  }

  async init() {
    await app.whenReady();
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
mainProcess.init().catch(console.error);

// Process management
ipcMain.handle('process:start', async (event, { command, args, cwd }) => {
  return processManager.startProcess(command, args, { cwd });
});

ipcMain.handle('process:stop', async (event, processId) => {
  return processManager.stopProcess(processId);
});

ipcMain.handle('process:list', async () => {
  return processManager.getRunningProcesses();
});

// Theme management
ipcMain.handle('get-theme', () => {
  return mainProcess.services.themeManager.getTheme();
});

ipcMain.handle('set-theme', (event, theme) => {
  return mainProcess.services.themeManager.setTheme(theme);
});

ipcMain.handle('toggle-theme', () => {
  return mainProcess.services.themeManager.toggleTheme();
});

// File system operations
ipcMain.handle('save-file', async (event, { fileName, data }) => {
  return await fileSystem.saveFile(fileName, data);
});

ipcMain.handle('read-file', async (event, fileName) => {
  return await fileSystem.readFile(fileName);
});

ipcMain.handle('delete-file', async (event, fileName) => {
  return await fileSystem.deleteFile(fileName);
});

ipcMain.handle('list-files', async () => {
  return await fileSystem.listFiles();
});

// Database operations
ipcMain.handle('db-query', async (event, { sql, params }) => {
  return await db.all(sql, params);
});

// Store operations
ipcMain.handle('store:create', async (event, storeData) => {
  const sql = `INSERT INTO stores (name, type, location) VALUES (?, ?, ?)`;
  const params = [storeData.name, storeData.type, storeData.location];
  return await db.run(sql, params);
});

ipcMain.handle('store:getAll', async () => {
  return await db.all('SELECT * FROM stores ORDER BY name');
});

ipcMain.handle('store:get', async (event, id) => {
  return await db.get('SELECT * FROM stores WHERE id = ?', [id]);
});

ipcMain.handle('store:update', async (event, { id, ...storeData }) => {
  const sql = `UPDATE stores SET name = ?, type = ?, location = ? WHERE id = ?`;
  const params = [storeData.name, storeData.type, storeData.location, id];
  return await db.run(sql, params);
});

ipcMain.handle('store:delete', async (event, id) => {
  return await db.run('DELETE FROM stores WHERE id = ?', [id]);
});

// Product operations
ipcMain.handle('product:create', async (event, productData) => {
  const sql = `INSERT INTO products (name, description, category, unit_price) VALUES (?, ?, ?, ?)`;
  const params = [productData.name, productData.description, productData.category, productData.unitPrice];
  return await db.run(sql, params);
});

ipcMain.handle('product:getAll', async () => {
  return await db.all('SELECT * FROM products ORDER BY name');
});

ipcMain.handle('product:get', async (event, id) => {
  return await db.get('SELECT * FROM products WHERE id = ?', [id]);
});

ipcMain.handle('product:update', async (event, { id, ...productData }) => {
  const sql = `UPDATE products SET name = ?, description = ?, category = ?, unit_price = ? WHERE id = ?`;
  const params = [productData.name, productData.description, productData.category, productData.unitPrice, id];
  return await db.run(sql, params);
});

ipcMain.handle('product:delete', async (event, id) => {
  return await db.run('DELETE FROM products WHERE id = ?', [id]);
});

// Inventory operations
ipcMain.handle('inventory:add', async (event, data) => {
  const sql = `INSERT INTO inventory (store_id, product_id, quantity, min_quantity, max_quantity) 
               VALUES (?, ?, ?, ?, ?)`;
  const params = [data.storeId, data.productId, data.quantity, data.minQuantity, data.maxQuantity];
  return await db.run(sql, params);
});

ipcMain.handle('inventory:update', async (event, data) => {
  const sql = `UPDATE inventory SET quantity = ?, min_quantity = ?, max_quantity = ? 
               WHERE store_id = ? AND product_id = ?`;
  const params = [data.quantity, data.minQuantity, data.maxQuantity, data.storeId, data.productId];
  return await db.run(sql, params);
});

ipcMain.handle('inventory:get', async (event, storeId) => {
  const sql = `
      SELECT i.*, p.name as product_name, p.description, p.category, p.unit_price
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.store_id = ?
  `;
  return await db.all(sql, [storeId]);
});

ipcMain.handle('inventory:getProduct', async (event, { storeId, productId }) => {
  const sql = `
      SELECT i.*, p.name as product_name, p.description, p.category, p.unit_price
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.store_id = ? AND i.product_id = ?
  `;
  return await db.get(sql, [storeId, productId]);
});

ipcMain.handle('inventory:remove', async (event, { storeId, productId }) => {
  return await db.run(
      'DELETE FROM inventory WHERE store_id = ? AND product_id = ?',
      [storeId, productId]
  );
});

// Customer operations
ipcMain.handle('customer:create', async (event, customerData) => {
  const sql = `INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)`;
  const params = [customerData.name, customerData.email, customerData.phone, customerData.address];
  return await db.run(sql, params);
});

ipcMain.handle('customer:getAll', async () => {
  return await db.all('SELECT * FROM customers ORDER BY name');
});

ipcMain.handle('customer:get', async (event, id) => {
  return await db.get('SELECT * FROM customers WHERE id = ?', [id]);
});

ipcMain.handle('customer:update', async (event, { id, ...customerData }) => {
  const sql = `UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?`;
  const params = [customerData.name, customerData.email, customerData.phone, customerData.address, id];
  return await db.run(sql, params);
});

ipcMain.handle('customer:delete', async (event, id) => {
  return await db.run('DELETE FROM customers WHERE id = ?', [id]);
});

// Sales operations
ipcMain.handle('sale:create', async (event, saleData) => {
  const { storeId, customerId, items, totalAmount, paymentMethod } = saleData;
  
  await db.run('BEGIN TRANSACTION');
  
  try {
      // Create sale record
      const saleResult = await db.run(
          'INSERT INTO sales (store_id, customer_id, total_amount, payment_method) VALUES (?, ?, ?, ?)',
          [storeId, customerId, totalAmount, paymentMethod]
      );
      
      const saleId = saleResult.lastID;
      
      // Add sale items and update inventory
      for (const item of items) {
          await db.run(
              'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
              [saleId, item.productId, item.quantity, item.unitPrice, item.totalPrice]
          );
          
          await db.run(
              'UPDATE inventory SET quantity = quantity - ? WHERE store_id = ? AND product_id = ?',
              [item.quantity, storeId, item.productId]
          );
      }
      
      await db.run('COMMIT');
      return { success: true, saleId };
  } catch (error) {
      await db.run('ROLLBACK');
      throw error;
  }
});

ipcMain.handle('sale:getAll', async (event, filters = {}) => {
  let sql = `
      SELECT s.*, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
  `;
  const params = [];

  if (filters.startDate) {
      sql += ` AND date(s.created_at) >= date(?)`;
      params.push(filters.startDate);
  }
  if (filters.endDate) {
      sql += ` AND date(s.created_at) <= date(?)`;
      params.push(filters.endDate);
  }
  if (filters.storeId) {
      sql += ` AND s.store_id = ?`;
      params.push(filters.storeId);
  }

  sql += ` ORDER BY s.created_at DESC`;

  return await db.all(sql, params);
});

ipcMain.handle('sale:get', async (event, id) => {
  const sale = await db.get(`
      SELECT s.*, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ?
  `, [id]);

  if (sale) {
      sale.items = await db.all(`
          SELECT si.*, p.name as product_name
          FROM sale_items si
          JOIN products p ON si.product_id = p.id
          WHERE si.sale_id = ?
      `, [id]);
  }

  return sale;
});

ipcMain.handle('sale:getByStore', async (event, { storeId, ...filters }) => {
  let sql = `
      SELECT s.*, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.store_id = ?
  `;
  const params = [storeId];

  if (filters.startDate) {
      sql += ` AND date(s.created_at) >= date(?)`;
      params.push(filters.startDate);
  }
  if (filters.endDate) {
      sql += ` AND date(s.created_at) <= date(?)`;
      params.push(filters.endDate);
  }

  sql += ` ORDER BY s.created_at DESC`;

  return await db.all(sql, params);
});

ipcMain.handle('sale:void', async (event, id) => {
  await db.run('BEGIN TRANSACTION');
  
  try {
      // Get sale items to restore inventory
      const items = await db.all(
          'SELECT * FROM sale_items WHERE sale_id = ?',
          [id]
      );
      
      const sale = await db.get(
          'SELECT store_id FROM sales WHERE id = ?',
          [id]
      );
      
      // Restore inventory quantities
      for (const item of items) {
          await db.run(
              'UPDATE inventory SET quantity = quantity + ? WHERE store_id = ? AND product_id = ?',
              [item.quantity, sale.store_id, item.product_id]
          );
      }
      
      // Mark sale as voided
      await db.run(
          'UPDATE sales SET status = "voided" WHERE id = ?',
          [id]
      );
      
      await db.run('COMMIT');
      return { success: true };
  } catch (error) {
      await db.run('ROLLBACK');
      throw error;
  }
});

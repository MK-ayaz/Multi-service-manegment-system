const { ipcMain } = require('electron');
const db = require('../services/databaseManager');
const ThemeManager = require('../services/themeManager');
const fileSystem = require('../services/fileSystem');
const { validate } = require('./validation');

let themeManager = null;
function requireTheme() {
  if (!themeManager) themeManager = new ThemeManager();
  return themeManager;
}

function withValidation(kind, handler) {
  return async (event, payload) => {
    const errors = validate(kind, payload);
    if (errors.length) throw new Error(`Validation failed: ${errors.join('; ')}`);
    return handler(event, payload);
  };
}

function registerHandlers() {
  // Window controls (registered exactly once)
  ipcMain.handle('window:minimize', (event) => event.sender.minimize());
  ipcMain.handle('window:maximize', (event) => {
    const win = event.sender.getOwnerBrowserWindow();
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.handle('window:close', (event) =>
    event.sender.getOwnerBrowserWindow().close()
  );

  // Theme
  ipcMain.handle('theme:get', () => requireTheme().getTheme());
  ipcMain.handle('theme:set', (event, theme) => requireTheme().setTheme(theme));
  ipcMain.handle('theme:toggle', () => requireTheme().toggleTheme());

  // Settings
  ipcMain.handle('settings:get', async () => {
    const settings = {};
    const rows = await db.all('SELECT key, value FROM settings');
    for (const row of rows) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }
    return settings;
  });
  ipcMain.handle('settings:save', async (event, settings) => {
    for (const [key, value] of Object.entries(settings || {})) {
      await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
        key,
        JSON.stringify(value),
      ]);
    }
    return true;
  });
  ipcMain.handle('settings:getSetting', async (event, key) => {
    const row = await db.get('SELECT value FROM settings WHERE key = ?', [key]);
    return row ? JSON.parse(row.value) : null;
  });
  ipcMain.handle('settings:setSetting', async (event, { key, value }) => {
    await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      key,
      JSON.stringify(value),
    ]);
    return true;
  });

  // File system (scoped to app documents dir only)
  const safeName = (n) => /^[\w.\-]+$/.test(n || '');
  ipcMain.handle('file:save', async (event, { fileName, data }) => {
    if (!safeName(fileName)) throw new Error('Invalid file name');
    return fileSystem.saveFile(fileName, data);
  });
  ipcMain.handle('file:read', async (event, fileName) => {
    if (!safeName(fileName)) throw new Error('Invalid file name');
    return fileSystem.readFile(fileName);
  });
  ipcMain.handle('file:delete', async (event, fileName) => {
    if (!safeName(fileName)) throw new Error('Invalid file name');
    return fileSystem.deleteFile(fileName);
  });
  ipcMain.handle('file:list', async () => fileSystem.listFiles());

  // Dashboard aggregates (parametrized, no renderer SQL)
  ipcMain.handle('dashboard:stats', async () => {
    const inv = await db.get('SELECT COALESCE(SUM(quantity),0) as total FROM inventory');
    const today = new Date().toISOString().split('T')[0];
    const sales = await db.get(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as total
       FROM sales WHERE date(created_at) = date(?)`,
      [today]
    );
    return {
      totalProducts: inv?.total || 0,
      totalSales: sales?.count || 0,
      revenue: sales?.total || 0,
    };
  });

  // Stores
  ipcMain.handle(
    'store:create',
    withValidation('store', async (event, d) => {
      const r = await db.run('INSERT INTO stores (name, type, location) VALUES (?, ?, ?)', [
        d.name,
        d.type,
        d.location ?? null,
      ]);
      return { id: r.lastID };
    })
  );
  ipcMain.handle('store:getAll', () => db.all('SELECT * FROM stores ORDER BY name'));
  ipcMain.handle('store:get', (event, id) => db.get('SELECT * FROM stores WHERE id = ?', [id]));
  ipcMain.handle(
    'store:update',
    withValidation('store', async (event, { id, ...d }) => {
      await db.run('UPDATE stores SET name = ?, type = ?, location = ? WHERE id = ?', [
        d.name,
        d.type,
        d.location ?? null,
        id,
      ]);
      return { id };
    })
  );
  ipcMain.handle('store:delete', (event, id) => db.run('DELETE FROM stores WHERE id = ?', [id]));

  // Products
  ipcMain.handle(
    'product:create',
    withValidation('product', async (event, d) => {
      const r = await db.run(
        'INSERT INTO products (name, description, category, unit_price) VALUES (?, ?, ?, ?)',
        [d.name, d.description ?? null, d.category, d.unitPrice]
      );
      return { id: r.lastID };
    })
  );
  ipcMain.handle('product:getAll', () => db.all('SELECT * FROM products ORDER BY name'));
  ipcMain.handle('product:get', (event, id) => db.get('SELECT * FROM products WHERE id = ?', [id]));
  ipcMain.handle(
    'product:update',
    withValidation('product', async (event, { id, ...d }) => {
      await db.run(
        'UPDATE products SET name = ?, description = ?, category = ?, unit_price = ? WHERE id = ?',
        [d.name, d.description ?? null, d.category, d.unitPrice, id]
      );
      return { id };
    })
  );
  ipcMain.handle('product:delete', (event, id) =>
    db.run('DELETE FROM products WHERE id = ?', [id])
  );

  // Inventory
  ipcMain.handle(
    'inventory:add',
    withValidation('inventory', async (event, d) => {
      const exists = await db.get(
        'SELECT id FROM inventory WHERE store_id = ? AND product_id = ?',
        [d.storeId, d.productId]
      );
      if (exists) throw new Error('Product already exists in this store inventory');
      await db.run(
        'INSERT INTO inventory (store_id, product_id, quantity, min_quantity, max_quantity) VALUES (?, ?, ?, ?, ?)',
        [d.storeId, d.productId, d.quantity, d.minQuantity, d.maxQuantity]
      );
      return { ok: true };
    })
  );
  ipcMain.handle(
    'inventory:update',
    withValidation('inventory', async (event, d) => {
      await db.run(
        'UPDATE inventory SET quantity = ?, min_quantity = ?, max_quantity = ? WHERE store_id = ? AND product_id = ?',
        [d.quantity, d.minQuantity, d.maxQuantity, d.storeId, d.productId]
      );
      return { ok: true };
    })
  );
  ipcMain.handle('inventory:get', (event, storeId) =>
    db.all(
      `SELECT i.*, p.name as product_name, p.description, p.category, p.unit_price
       FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.store_id = ?`,
      [storeId]
    )
  );
  ipcMain.handle('inventory:getProduct', (event, { storeId, productId }) =>
    db.get(
      `SELECT i.*, p.name as product_name, p.description, p.category, p.unit_price
       FROM inventory i JOIN products p ON i.product_id = p.id
       WHERE i.store_id = ? AND i.product_id = ?`,
      [storeId, productId]
    )
  );
  ipcMain.handle('inventory:remove', (event, { storeId, productId }) =>
    db.run('DELETE FROM inventory WHERE store_id = ? AND product_id = ?', [storeId, productId])
  );

  // Customers
  ipcMain.handle(
    'customer:create',
    withValidation('customer', async (event, d) => {
      const r = await db.run(
        'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
        [d.name, d.email ?? null, d.phone ?? null, d.address ?? null]
      );
      return { id: r.lastID };
    })
  );
  ipcMain.handle('customer:getAll', () => db.all('SELECT * FROM customers ORDER BY name'));
  ipcMain.handle('customer:get', (event, id) =>
    db.get('SELECT * FROM customers WHERE id = ?', [id])
  );
  ipcMain.handle(
    'customer:update',
    withValidation('customer', async (event, { id, ...d }) => {
      await db.run(
        'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
        [d.name, d.email ?? null, d.phone ?? null, d.address ?? null, id]
      );
      return { id };
    })
  );
  ipcMain.handle('customer:delete', (event, id) =>
    db.run('DELETE FROM customers WHERE id = ?', [id])
  );

  // Sales
  ipcMain.handle(
    'sale:create',
    withValidation('sale', async (event, d) => {
      const { storeId, customerId, items, totalAmount, paymentMethod } = d;
      return db.withTransaction(async () => {
        for (const it of items) {
          const inv = await db.get(
            'SELECT quantity FROM inventory WHERE store_id = ? AND product_id = ?',
            [storeId, it.productId]
          );
          if (!inv || inv.quantity < it.quantity)
            throw new Error(`Insufficient stock for product ${it.productId}`);
        }
        const r = await db.run(
          'INSERT INTO sales (store_id, customer_id, total_amount, payment_method, status) VALUES (?, ?, ?, ?, ?)',
          [storeId, customerId ?? null, totalAmount, paymentMethod, 'completed']
        );
        const saleId = r.lastID;
        for (const it of items) {
          await db.run(
            'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
            [saleId, it.productId, it.quantity, it.unitPrice, it.totalPrice ?? it.unitPrice * it.quantity]
          );
          await db.run(
            'UPDATE inventory SET quantity = quantity - ? WHERE store_id = ? AND product_id = ?',
            [it.quantity, storeId, it.productId]
          );
        }
        return { success: true, saleId };
      });
    })
  );
  ipcMain.handle('sale:getAll', (event, filters = {}) => {
    let sql = `SELECT s.*, c.name as customer_name FROM sales s
               LEFT JOIN customers c ON s.customer_id = c.id WHERE 1=1`;
    const p = [];
    if (filters.startDate) { sql += ' AND date(s.created_at) >= date(?)'; p.push(filters.startDate); }
    if (filters.endDate) { sql += ' AND date(s.created_at) <= date(?)'; p.push(filters.endDate); }
    if (filters.storeId) { sql += ' AND s.store_id = ?'; p.push(filters.storeId); }
    sql += ' ORDER BY s.created_at DESC';
    return db.all(sql, p);
  });
  ipcMain.handle('sale:get', async (event, id) => {
    const sale = await db.get(
      `SELECT s.*, c.name as customer_name FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = ?`,
      [id]
    );
    if (sale) {
      sale.items = await db.all(
        `SELECT si.*, p.name as product_name FROM sale_items si
         JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?`,
        [id]
      );
    }
    return sale;
  });
  ipcMain.handle('sale:getByStore', (event, { storeId, ...filters }) => {
    let sql = `SELECT s.*, c.name as customer_name FROM sales s
               LEFT JOIN customers c ON s.customer_id = c.id WHERE s.store_id = ?`;
    const p = [storeId];
    if (filters.startDate) { sql += ' AND date(s.created_at) >= date(?)'; p.push(filters.startDate); }
    if (filters.endDate) { sql += ' AND date(s.created_at) <= date(?)'; p.push(filters.endDate); }
    sql += ' ORDER BY s.created_at DESC';
    return db.all(sql, p);
  });
  ipcMain.handle('sale:void', (event, id) =>
    db.withTransaction(async () => {
      const sale = await db.get('SELECT * FROM sales WHERE id = ?', [id]);
      if (!sale) throw new Error('Sale not found');
      if (sale.status === 'voided') return { success: true, alreadyVoided: true };
      const items = await db.all('SELECT * FROM sale_items WHERE sale_id = ?', [id]);
      for (const it of items) {
        await db.run(
          'UPDATE inventory SET quantity = quantity + ? WHERE store_id = ? AND product_id = ?',
          [it.quantity, sale.store_id, it.product_id]
        );
      }
      await db.run('UPDATE sales SET status = ? WHERE id = ?', ['voided', id]);
      return { success: true };
    })
  );
}

module.exports = { registerHandlers, getThemeManager: requireTheme };

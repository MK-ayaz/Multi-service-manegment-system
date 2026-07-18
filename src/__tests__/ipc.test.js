// @jest-environment node
jest.mock('electron', () => {
  const handlers = {};
  return {
    ipcMain: { handle: (channel, fn) => { handlers[channel] = fn; } },
    nativeTheme: { themeSource: 'light' },
    __handlers: handlers,
  };
});

const electron = require('electron');
const { DatabaseManager } = require('../../electron/services/databaseManager');
const { registerHandlers } = require('../../electron/ipc');

async function setup() {
  const db = new DatabaseManager();
  db.dbPath = ':memory:';
  await db.initialize(':memory:');

  const dbModule = require('../../electron/services/databaseManager');
  dbModule.db = db.db;
  dbModule.DatabaseManager = DatabaseManager;

  registerHandlers();
  return { db, handlers: electron.__handlers };
}

describe('IPC handlers — business logic', () => {
  let db, handlers;

  beforeEach(async () => {
    ({ db, handlers } = await setup());
  });
  afterEach(async () => {
    await db.close();
  });

  async function seed() {
    const store = await handlers['store:create'](null, { name: 'S1', type: 'retail' });
    const product = await handlers['product:create'](null, {
      name: 'P1',
      category: 'cat',
      unitPrice: 10,
    });
    await handlers['inventory:add'](null, {
      storeId: store.id,
      productId: product.id,
      quantity: 5,
      minQuantity: 1,
      maxQuantity: 10,
    });
    return { storeId: store.id, productId: product.id };
  }

  test('store:create returns generated id', async () => {
    const res = await handlers['store:create'](null, { name: 'S', type: 'retail' });
    expect(res.id).toBeGreaterThan(0);
  });

  test('store:create rejects empty name (validation)', async () => {
    await expect(
      handlers['store:create'](null, { name: '  ', type: 'retail' })
    ).rejects.toThrow(/name is required/);
  });

  test('sale:create decrements inventory and returns saleId', async () => {
    const { storeId, productId } = await seed();
    const res = await handlers['sale:create'](null, {
      storeId,
      customerId: null,
      items: [{ productId, quantity: 2, unitPrice: 10, totalPrice: 20 }],
      totalAmount: 20,
      paymentMethod: 'cash',
    });
    expect(res.success).toBe(true);
    expect(res.saleId).toBeGreaterThan(0);

    const inv = await db.get(
      'SELECT quantity FROM inventory WHERE store_id = ? AND product_id = ?',
      [storeId, productId]
    );
    expect(inv.quantity).toBe(3);
  });

  test('sale:create rejects overselling', async () => {
    const { storeId, productId } = await seed();
    await expect(
      handlers['sale:create'](null, {
        storeId,
        items: [{ productId, quantity: 99, unitPrice: 10 }],
        totalAmount: 990,
        paymentMethod: 'cash',
      })
    ).rejects.toThrow(/Insufficient stock/);
  });

  test('sale:void restores inventory once and guards double-void', async () => {
    const { storeId, productId } = await seed();
    const sale = await handlers['sale:create'](null, {
      storeId,
      items: [{ productId, quantity: 2, unitPrice: 10, totalPrice: 20 }],
      totalAmount: 20,
      paymentMethod: 'cash',
    });

    expect((await handlers['sale:void'](null, sale.saleId)).success).toBe(true);
    let inv = await db.get(
      'SELECT quantity FROM inventory WHERE store_id = ? AND product_id = ?',
      [storeId, productId]
    );
    expect(inv.quantity).toBe(5);

    const second = await handlers['sale:void'](null, sale.saleId);
    expect(second.alreadyVoided).toBe(true);
    inv = await db.get(
      'SELECT quantity FROM inventory WHERE store_id = ? AND product_id = ?',
      [storeId, productId]
    );
    expect(inv.quantity).toBe(5);
  });

  test('inventory:add rejects duplicate product in same store', async () => {
    const { storeId, productId } = await seed();
    await expect(
      handlers['inventory:add'](null, {
        storeId,
        productId,
        quantity: 1,
        minQuantity: 0,
        maxQuantity: 5,
      })
    ).rejects.toThrow(/already exists/);
  });
});

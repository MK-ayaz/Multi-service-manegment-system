import { MockDatabase } from './db';

function makeDb() {
  return new MockDatabase();
}

describe('MockDatabase', () => {
  test('login succeeds with valid credentials and scopes to tenant', async () => {
    const db = makeDb();
    const session = await db.login({ email: 'admin@acme.com', password: 'admin123' });
    expect(session.user.tenantId).toBe('tnt_acme');
    expect(session.tenantId).toBe('tnt_acme');
  });

  test('login fails with bad password', async () => {
    const db = makeDb();
    await expect(db.login({ email: 'admin@acme.com', password: 'wrong' })).rejects.toThrow();
  });

  test('tenant switch changes session scope', async () => {
    const db = makeDb();
    await db.login({ email: 'admin@acme.com', password: 'admin123' });
    await db.switchTenant('tnt_healthplus');
    const stores = await db.listStores();
    expect(stores.every((s) => s.tenantId === 'tnt_healthplus')).toBe(true);
  });

  test('creating a sale decrements inventory and can be voided once', async () => {
    const db = makeDb();
    await db.login({ email: 'admin@acme.com', password: 'admin123' });
    const before = (await db.listInventory('sto_1')).find((i) => i.productId === 'prd_1');
    const sale = await db.createSale({
      storeId: 'sto_1',
      items: [{ productId: 'prd_1', quantity: 2, unitPrice: before.unitPrice, totalPrice: before.unitPrice * 2 }],
      totalAmount: before.unitPrice * 2,
      paymentMethod: 'cash',
    });
    const after = (await db.listInventory('sto_1')).find((i) => i.productId === 'prd_1');
    expect(after.quantity).toBe(before.quantity - 2);

    const voided = await db.voidSale(sale.id);
    expect(voided.status).toBe('voided');
    const restored = (await db.listInventory('sto_1')).find((i) => i.productId === 'prd_1');
    expect(restored.quantity).toBe(before.quantity);

    const secondVoid = await db.voidSale(sale.id);
    expect(secondVoid.status).toBe('voided');
    const still = (await db.listInventory('sto_1')).find((i) => i.productId === 'prd_1');
    expect(still.quantity).toBe(before.quantity);
  });

  test('dashboard stats are tenant-scoped', async () => {
    const db = makeDb();
    await db.login({ email: 'manager@healthplus.com', password: 'manager123' });
    const stats = await db.getDashboardStats();
    expect(stats.totalStores).toBe(2);
    expect(stats.revenueSeries.length).toBe(14);
  });
});

import { MockDatabase } from './db';

function makeDb() {
  return new MockDatabase();
}

describe('MockDatabase (single store)', () => {
  test('getStore returns the store profile', async () => {
    const db = makeDb();
    const store = await db.getStore();
    expect(store.name).toBeTruthy();
  });

  test('creating a sale decrements inventory and can be voided once', async () => {
    const db = makeDb();
    const before = (await db.listInventory()).find((i) => i.productId === 'prd_1');
    const sale = await db.createSale({
      items: [{ productId: 'prd_1', quantity: 2, unitPrice: before.unitPrice, totalPrice: before.unitPrice * 2 }],
      totalAmount: before.unitPrice * 2,
      paymentMethod: 'cash',
    });
    const after = (await db.listInventory()).find((i) => i.productId === 'prd_1');
    expect(after.quantity).toBe(before.quantity - 2);

    const voided = await db.voidSale(sale.id);
    expect(voided.status).toBe('voided');
    const restored = (await db.listInventory()).find((i) => i.productId === 'prd_1');
    expect(restored.quantity).toBe(before.quantity);

    const secondVoid = await db.voidSale(sale.id);
    expect(secondVoid.status).toBe('voided');
    const still = (await db.listInventory()).find((i) => i.productId === 'prd_1');
    expect(still.quantity).toBe(before.quantity);
  });

  test('adjustStock rejects reducing below zero', async () => {
    const db = makeDb();
    const inv = (await db.listInventory()).find((i) => i.productId === 'prd_5'); // quantity 0
    await expect(db.adjustStock('prd_5', -5, 'test')).rejects.toThrow();
    const same = (await db.listInventory()).find((i) => i.productId === 'prd_5');
    expect(same.quantity).toBe(inv.quantity);
  });

  test('dashboard stats include revenue series of 14 days', async () => {
    const db = makeDb();
    const stats = await db.getDashboardStats();
    expect(stats.revenueSeries.length).toBe(14);
    expect(stats.totalProducts).toBeGreaterThan(0);
  });

  test('create/update/delete supplier works', async () => {
    const db = makeDb();
    const created = await db.createSupplier({ name: 'Test Co', leadTimeDays: 4 });
    expect(created.id).toBeTruthy();
    await db.updateSupplier(created.id, { name: 'Test Co 2' });
    const list = await db.listSuppliers();
    expect(list.find((s) => s.id === created.id).name).toBe('Test Co 2');
    await db.deleteSupplier(created.id);
    expect((await db.listSuppliers()).find((s) => s.id === created.id)).toBeUndefined();
  });
});

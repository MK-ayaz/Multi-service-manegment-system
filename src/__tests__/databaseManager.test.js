// @jest-environment node
const { DatabaseManager } = require('../../electron/services/databaseManager');

function makeDb() {
  const db = new DatabaseManager();
  db.dbPath = ':memory:';
  return db;
}

describe('DatabaseManager', () => {
  let db;
  beforeEach(async () => {
    db = makeDb();
    await db.initialize(':memory:');
  });
  afterEach(async () => {
    await db.close();
  });

  test('creates all tables including sales.status', async () => {
    const cols = await db.all('PRAGMA table_info(sales)');
    expect(cols.map((c) => c.name)).toContain('status');
  });

  test('run() returns { lastID, changes }', async () => {
    const res = await db.run('INSERT INTO stores (name, type) VALUES (?, ?)', [
      'Main',
      'retail',
    ]);
    expect(typeof res.lastID).toBe('number');
    expect(res.lastID).toBeGreaterThan(0);
    expect(res.changes).toBe(1);
  });

  test('migrate() is idempotent (no duplicate column error)', async () => {
    await expect(db.migrate()).resolves.toBeUndefined();
    await expect(db.migrate()).resolves.toBeUndefined();
  });

  test('withTransaction rolls back on error', async () => {
    await db.run('INSERT INTO stores (name, type) VALUES (?, ?)', ['S', 'retail']);
    await expect(
      db.withTransaction(async () => {
        await db.run(
          'INSERT INTO products (name, category, unit_price) VALUES (?, ?, ?)',
          ['P', 'cat', 1.5]
        );
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');

    expect((await db.all('SELECT * FROM products')).length).toBe(0);
  });
});

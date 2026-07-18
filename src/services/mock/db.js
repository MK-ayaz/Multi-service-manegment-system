// In-memory mock database. Simulates a backend with async latency.
// Swap this module for real API calls later without touching the UI.

import * as seed from './seed';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function delay(ms = 120) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

class MockDatabase {
  constructor() {
    this.tenants = clone(seed.tenants);
    this.users = clone(seed.users);
    this.stores = clone(seed.stores);
    this.products = clone(seed.products);
    this.inventory = clone(seed.inventory);
    this.customers = clone(seed.customers);
    this.sales = clone(seed.sales);
    this.settings = clone(seed.settings);
    this.session = null; // { user, tenantId }
  }

  // ---- Auth ----
  async login({ email, password }) {
    await delay();
    const user = this.users.find((u) => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid email or password');
    const { password: _pw, ...safe } = user;
    this.session = { user: safe, tenantId: user.tenantId };
    return clone(this.session);
  }

  async logout() {
    await delay(40);
    this.session = null;
  }

  async switchTenant(tenantId) {
    await delay(40);
    if (!this.session) throw new Error('Not authenticated');
    if (!this.tenants.find((t) => t.id === tenantId)) throw new Error('Tenant not found');
    this.session.tenantId = tenantId;
    return clone(this.session);
  }

  getSession() {
    return this.session ? clone(this.session) : null;
  }

  // ---- Scoped helpers ----
  scope(collection) {
    const tid = this.session?.tenantId;
    return collection.filter((r) => r.tenantId === tid);
  }

  // ---- Stores ----
  async listStores() {
    await delay();
    return clone(this.scope(this.stores));
  }
  async createStore(data) {
    await delay();
    if (!data.name || !data.type) throw new Error('name and type are required');
    const record = { id: uid('sto'), tenantId: this.session.tenantId, ...data };
    this.stores.push(record);
    return clone(record);
  }
  async updateStore(id, data) {
    await delay();
    const r = this.stores.find((x) => x.id === id && x.tenantId === this.session.tenantId);
    if (!r) throw new Error('Store not found');
    Object.assign(r, data);
    return clone(r);
  }
  async deleteStore(id) {
    await delay();
    this.stores = this.stores.filter((x) => !(x.id === id && x.tenantId === this.session.tenantId));
    return true;
  }

  // ---- Products ----
  async listProducts() {
    await delay();
    return clone(this.scope(this.products));
  }
  async createProduct(data) {
    await delay();
    if (!data.name || !data.category) throw new Error('name and category are required');
    const record = { id: uid('prd'), tenantId: this.session.tenantId, ...data };
    this.products.push(record);
    return clone(record);
  }
  async updateProduct(id, data) {
    await delay();
    const r = this.products.find((x) => x.id === id && x.tenantId === this.session.tenantId);
    if (!r) throw new Error('Product not found');
    Object.assign(r, data);
    return clone(r);
  }
  async deleteProduct(id) {
    await delay();
    this.products = this.products.filter((x) => !(x.id === id && x.tenantId === this.session.tenantId));
    return true;
  }

  // ---- Inventory ----
  async listInventory(storeId) {
    await delay();
    return clone(
      this.inventory
        .filter((i) => i.tenantId === this.session.tenantId && (!storeId || i.storeId === storeId))
        .map((i) => {
          const product = this.products.find((p) => p.id === i.productId);
          return { ...i, productName: product?.name, category: product?.category, unitPrice: product?.unitPrice };
        })
    );
  }
  async upsertInventory(data) {
    await delay();
    const existing = this.inventory.find(
      (i) => i.tenantId === this.session.tenantId && i.storeId === data.storeId && i.productId === data.productId
    );
    if (existing) {
      Object.assign(existing, data);
      return clone(existing);
    }
    const record = { id: uid('inv'), tenantId: this.session.tenantId, ...data };
    this.inventory.push(record);
    return clone(record);
  }
  async removeInventory(storeId, productId) {
    await delay();
    this.inventory = this.inventory.filter(
      (i) => !(i.tenantId === this.session.tenantId && i.storeId === storeId && i.productId === productId)
    );
    return true;
  }

  // ---- Customers ----
  async listCustomers() {
    await delay();
    return clone(this.scope(this.customers));
  }
  async createCustomer(data) {
    await delay();
    if (!data.name) throw new Error('name is required');
    const record = { id: uid('cus'), tenantId: this.session.tenantId, ...data };
    this.customers.push(record);
    return clone(record);
  }
  async updateCustomer(id, data) {
    await delay();
    const r = this.customers.find((x) => x.id === id && x.tenantId === this.session.tenantId);
    if (!r) throw new Error('Customer not found');
    Object.assign(r, data);
    return clone(r);
  }
  async deleteCustomer(id) {
    await delay();
    this.customers = this.customers.filter((x) => !(x.id === id && x.tenantId === this.session.tenantId));
    return true;
  }

  // ---- Sales ----
  async listSales({ storeId, startDate, endDate } = {}) {
    await delay();
    let rows = this.scope(this.sales);
    if (storeId) rows = rows.filter((s) => s.storeId === storeId);
    if (startDate) rows = rows.filter((s) => new Date(s.createdAt) >= new Date(startDate));
    if (endDate) rows = rows.filter((s) => new Date(s.createdAt) <= new Date(endDate));
    return clone(rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }
  async createSale(data) {
    await delay();
    if (!Array.isArray(data.items) || data.items.length === 0) throw new Error('items required');
    // Decrement inventory
    for (const item of data.items) {
      const inv = this.inventory.find(
        (i) => i.tenantId === this.session.tenantId && i.storeId === data.storeId && i.productId === item.productId
      );
      if (!inv || inv.quantity < item.quantity) throw new Error(`Insufficient stock for ${item.productId}`);
      inv.quantity -= item.quantity;
    }
    const record = {
      id: uid('sale'),
      tenantId: this.session.tenantId,
      status: 'completed',
      createdAt: new Date().toISOString(),
      customerId: data.customerId ?? null,
      ...data,
    };
    this.sales.push(record);
    return clone(record);
  }
  async voidSale(id) {
    await delay();
    const sale = this.sales.find((s) => s.id === id && s.tenantId === this.session.tenantId);
    if (!sale) throw new Error('Sale not found');
    if (sale.status === 'voided') return clone(sale);
    for (const item of sale.items) {
      const inv = this.inventory.find(
        (i) => i.tenantId === this.session.tenantId && i.storeId === sale.storeId && i.productId === item.productId
      );
      if (inv) inv.quantity += item.quantity;
    }
    sale.status = 'voided';
    return clone(sale);
  }

  // ---- Analytics ----
  async getDashboardStats() {
    await delay();
    const tid = this.session.tenantId;
    const tenantSales = this.sales.filter((s) => s.tenantId === tid && s.status !== 'voided');
    const today = new Date().toISOString().split('T')[0];
    const todaySales = tenantSales.filter((s) => s.createdAt.split('T')[0] === today);
    const totalProducts = new Set(
      this.inventory.filter((i) => i.tenantId === tid).map((i) => i.productId)
    ).size;
    const lowStock = this.inventory.filter(
      (i) => i.tenantId === tid && i.quantity <= i.minQuantity
    ).length;

    // Revenue last 14 days
    const revenueSeries = [];
    for (let d = 13; d >= 0; d--) {
      const day = new Date();
      day.setDate(day.getDate() - d);
      const key = day.toISOString().split('T')[0];
      const sum = tenantSales
        .filter((s) => s.createdAt.split('T')[0] === key)
        .reduce((acc, s) => acc + s.totalAmount, 0);
      revenueSeries.push({ date: key, revenue: +sum.toFixed(2) });
    }

    // Sales by store
    const byStore = this.stores
      .filter((s) => s.tenantId === tid)
      .map((store) => {
        const count = tenantSales.filter((s) => s.storeId === store.id).length;
        const revenue = tenantSales
          .filter((s) => s.storeId === store.id)
          .reduce((acc, s) => acc + s.totalAmount, 0);
        return { store: store.name, sales: count, revenue: +revenue.toFixed(2) };
      });

    return {
      totalStores: this.stores.filter((s) => s.tenantId === tid).length,
      totalProducts,
      lowStock,
      todaySales: todaySales.length,
      todayRevenue: +todaySales.reduce((a, s) => a + s.totalAmount, 0).toFixed(2),
      revenueSeries,
      byStore,
    };
  }

  // ---- Settings ----
  async getSettings() {
    await delay(40);
    return clone(this.settings);
  }
  async saveSettings(data) {
    await delay(40);
    this.settings = { ...this.settings, ...data };
    return clone(this.settings);
  }

  // ---- Tenants (for switching) ----
  async listTenants() {
    await delay(40);
    return clone(this.tenants);
  }
}

// Singleton per app session.
const db = new MockDatabase();
export default db;
export { MockDatabase };

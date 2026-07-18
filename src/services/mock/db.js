// Local mock database for a SINGLE store management system.
// Async, in-memory, simulates a backend. Swap for real API in services/api.js.

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
    this.store = clone(seed.store);
    this.products = clone(seed.products);
    this.inventory = clone(seed.inventory);
    this.customers = clone(seed.customers);
    this.suppliers = clone(seed.suppliers);
    this.sales = clone(seed.sales);
    this.settings = clone(seed.settings);
  }

  // ---- Store profile ----
  async getStore() {
    await delay(40);
    return clone(this.store);
  }
  async updateStore(data) {
    await delay(40);
    Object.assign(this.store, data);
    return clone(this.store);
  }

  // ---- Products ----
  async listProducts() {
    await delay();
    return clone(this.products);
  }
  async createProduct(data) {
    await delay();
    if (!data.name || !data.category) throw new Error('name and category are required');
    const record = { id: uid('prd'), sku: data.sku || '', ...data };
    this.products.push(record);
    return clone(record);
  }
  async updateProduct(id, data) {
    await delay();
    const r = this.products.find((x) => x.id === id);
    if (!r) throw new Error('Product not found');
    Object.assign(r, data);
    return clone(r);
  }
  async deleteProduct(id) {
    await delay();
    this.products = this.products.filter((x) => x.id !== id);
    return true;
  }

  // ---- Inventory ----
  async listInventory() {
    await delay();
    return clone(
      this.inventory.map((i) => {
        const p = this.products.find((x) => x.id === i.productId);
        return {
          ...i,
          productName: p?.name,
          sku: p?.sku,
          category: p?.category,
          unitPrice: p?.unitPrice,
        };
      })
    );
  }
  async upsertInventory(data) {
    await delay();
    const existing = this.inventory.find((i) => i.productId === data.productId);
    if (existing) {
      Object.assign(existing, data);
      return clone(existing);
    }
    const record = { id: uid('inv'), productId: data.productId, ...data };
    this.inventory.push(record);
    return clone(record);
  }
  async adjustStock(productId, delta, reason) {
    await delay();
    const inv = this.inventory.find((i) => i.productId === productId);
    if (!inv) throw new Error('Product not in inventory');
    const next = inv.quantity + delta;
    if (next < 0) throw new Error('Cannot reduce stock below zero');
    inv.quantity = next;
    if (delta > 0) inv.lastRestock = new Date().toISOString();
    return clone(inv);
  }
  async removeInventory(productId) {
    await delay();
    this.inventory = this.inventory.filter((i) => i.productId !== productId);
    return true;
  }

  // ---- Customers ----
  async listCustomers() {
    await delay();
    return clone(this.customers);
  }
  async createCustomer(data) {
    await delay();
    if (!data.name) throw new Error('name is required');
    const record = { id: uid('cus'), ...data };
    this.customers.push(record);
    return clone(record);
  }
  async updateCustomer(id, data) {
    await delay();
    const r = this.customers.find((x) => x.id === id);
    if (!r) throw new Error('Customer not found');
    Object.assign(r, data);
    return clone(r);
  }
  async deleteCustomer(id) {
    await delay();
    this.customers = this.customers.filter((x) => x.id !== id);
    return true;
  }

  // ---- Suppliers ----
  async listSuppliers() {
    await delay();
    return clone(this.suppliers);
  }
  async createSupplier(data) {
    await delay();
    if (!data.name) throw new Error('name is required');
    const record = { id: uid('sup'), ...data };
    this.suppliers.push(record);
    return clone(record);
  }
  async updateSupplier(id, data) {
    await delay();
    const r = this.suppliers.find((x) => x.id === id);
    if (!r) throw new Error('Supplier not found');
    Object.assign(r, data);
    return clone(r);
  }
  async deleteSupplier(id) {
    await delay();
    this.suppliers = this.suppliers.filter((x) => x.id !== id);
    return true;
  }

  // ---- Sales ----
  async listSales({ startDate, endDate } = {}) {
    await delay();
    let rows = this.sales;
    if (startDate) rows = rows.filter((s) => new Date(s.createdAt) >= new Date(startDate));
    if (endDate) rows = rows.filter((s) => new Date(s.createdAt) <= new Date(endDate));
    return clone(rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }
  async createSale(data) {
    await delay();
    if (!Array.isArray(data.items) || data.items.length === 0) throw new Error('items required');
    for (const item of data.items) {
      const inv = this.inventory.find((i) => i.productId === item.productId);
      if (!inv || inv.quantity < item.quantity) throw new Error(`Insufficient stock for ${item.productId}`);
      inv.quantity -= item.quantity;
    }
    const record = {
      id: uid('sale'),
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
    const sale = this.sales.find((s) => s.id === id);
    if (!sale) throw new Error('Sale not found');
    if (sale.status === 'voided') return clone(sale);
    for (const item of sale.items) {
      const inv = this.inventory.find((i) => i.productId === item.productId);
      if (inv) inv.quantity += item.quantity;
    }
    sale.status = 'voided';
    return clone(sale);
  }

  // ---- Analytics ----
  async getDashboardStats() {
    await delay();
    const active = this.sales.filter((s) => s.status !== 'voided');
    const today = new Date().toISOString().split('T')[0];
    const todaySales = active.filter((s) => s.createdAt.split('T')[0] === today);
    const lowStock = this.inventory.filter((i) => i.quantity <= i.minQuantity).length;
    const outOfStock = this.inventory.filter((i) => i.quantity === 0).length;
    const totalRevenue = active.reduce((a, s) => a + s.totalAmount, 0);
    const totalCustomers = this.customers.length;

    const revenueSeries = [];
    for (let d = 13; d >= 0; d--) {
      const day = new Date();
      day.setDate(day.getDate() - d);
      const key = day.toISOString().split('T')[0];
      const sum = active.filter((s) => s.createdAt.split('T')[0] === key).reduce((a, s) => a + s.totalAmount, 0);
      revenueSeries.push({ date: key, revenue: +sum.toFixed(2) });
    }

    const topProducts = [...this.inventory]
      .sort((a, b) => b.quantity * (b.unitPrice || 0) - a.quantity * (a.unitPrice || 0))
      .slice(0, 5)
      .map((i) => {
        const p = this.products.find((x) => x.id === i.productId);
        return { name: p?.name || i.productId, value: i.quantity, revenue: +(i.quantity * (i.unitPrice || 0)).toFixed(2) };
      });

    return {
      totalProducts: this.products.length,
      totalInventoryValue: +this.inventory.reduce((a, i) => a + i.quantity * (i.unitPrice || 0), 0).toFixed(2),
      lowStock,
      outOfStock,
      todaySales: todaySales.length,
      todayRevenue: +todaySales.reduce((a, s) => a + s.totalAmount, 0).toFixed(2),
      totalRevenue: +totalRevenue.toFixed(2),
      totalCustomers,
      revenueSeries,
      topProducts,
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
}

const db = new MockDatabase();
export default db;
export { MockDatabase };

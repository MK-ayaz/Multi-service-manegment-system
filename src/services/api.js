// Service layer: the single place the UI talks to "the backend".
// Today it delegates to the local mock DB; later these can call real APIs.
import db from './mock/db';

export const authService = {
  login: (creds) => db.login(creds),
  logout: () => db.logout(),
  switchTenant: (id) => db.switchTenant(id),
  getSession: () => db.getSession(),
  listTenants: () => db.listTenants(),
};

export const storeService = {
  list: () => db.listStores(),
  create: (d) => db.createStore(d),
  update: (id, d) => db.updateStore(id, d),
  remove: (id) => db.deleteStore(id),
};

export const productService = {
  list: () => db.listProducts(),
  create: (d) => db.createProduct(d),
  update: (id, d) => db.updateProduct(id, d),
  remove: (id) => db.deleteProduct(id),
};

export const inventoryService = {
  list: (storeId) => db.listInventory(storeId),
  upsert: (d) => db.upsertInventory(d),
  remove: (storeId, productId) => db.removeInventory(storeId, productId),
};

export const customerService = {
  list: () => db.listCustomers(),
  create: (d) => db.createCustomer(d),
  update: (id, d) => db.updateCustomer(id, d),
  remove: (id) => db.deleteCustomer(id),
};

export const saleService = {
  list: (filters) => db.listSales(filters),
  create: (d) => db.createSale(d),
  void: (id) => db.voidSale(id),
};

export const analyticsService = {
  dashboard: () => db.getDashboardStats(),
};

export const settingsService = {
  get: () => db.getSettings(),
  save: (d) => db.saveSettings(d),
};

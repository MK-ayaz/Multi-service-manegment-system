// Service layer: the single place the UI talks to "the backend".
// Today it delegates to the local mock DB; later these can call real APIs.
import db from './mock/db';

export const storeService = {
  get: () => db.getStore(),
  update: (d) => db.updateStore(d),
};

export const productService = {
  list: () => db.listProducts(),
  create: (d) => db.createProduct(d),
  update: (id, d) => db.updateProduct(id, d),
  remove: (id) => db.deleteProduct(id),
};

export const inventoryService = {
  list: () => db.listInventory(),
  upsert: (d) => db.upsertInventory(d),
  adjust: (productId, delta, reason) => db.adjustStock(productId, delta, reason),
  remove: (productId) => db.removeInventory(productId),
};

export const customerService = {
  list: () => db.listCustomers(),
  create: (d) => db.createCustomer(d),
  update: (id, d) => db.updateCustomer(id, d),
  remove: (id) => db.deleteCustomer(id),
};

export const supplierService = {
  list: () => db.listSuppliers(),
  create: (d) => db.createSupplier(d),
  update: (id, d) => db.updateSupplier(id, d),
  remove: (id) => db.deleteSupplier(id),
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

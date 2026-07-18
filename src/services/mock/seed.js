// Seed data for the local mock backend.
// Multi-tenant: each tenant owns a set of stores; data is scoped by tenantId.

export const tenants = [
  {
    id: 'tnt_acme',
    name: 'Acme Retail Group',
    plan: 'Enterprise',
    currency: 'USD',
    locale: 'en-US',
  },
  {
    id: 'tnt_healthplus',
    name: 'HealthPlus Pharmacies',
    plan: 'Professional',
    currency: 'USD',
    locale: 'en-US',
  },
];

export const users = [
  {
    id: 'usr_1',
    email: 'admin@acme.com',
    password: 'admin123',
    name: 'Ada Admin',
    role: 'admin',
    tenantId: 'tnt_acme',
  },
  {
    id: 'usr_2',
    email: 'manager@healthplus.com',
    password: 'manager123',
    name: 'Mo Manager',
    role: 'manager',
    tenantId: 'tnt_healthplus',
  },
  {
    id: 'usr_3',
    email: 'demo@demo.com',
    password: 'demo123',
    name: 'Dana Demo',
    role: 'admin',
    tenantId: 'tnt_acme',
  },
];

export const stores = [
  { id: 'sto_1', tenantId: 'tnt_acme', name: 'Acme Downtown', type: 'retail', location: 'New York, NY' },
  { id: 'sto_2', tenantId: 'tnt_acme', name: 'Acme Uptown', type: 'supermarket', location: 'New York, NY' },
  { id: 'sto_3', tenantId: 'tnt_healthplus', name: 'HealthPlus Central', type: 'pharmacy', location: 'Boston, MA' },
  { id: 'sto_4', tenantId: 'tnt_healthplus', name: 'HealthPlus West', type: 'pharmacy', location: 'Cambridge, MA' },
];

export const products = [
  { id: 'prd_1', tenantId: 'tnt_acme', name: 'Wireless Mouse', category: 'Electronics', unitPrice: 24.99 },
  { id: 'prd_2', tenantId: 'tnt_acme', name: 'Mechanical Keyboard', category: 'Electronics', unitPrice: 79.99 },
  { id: 'prd_3', tenantId: 'tnt_acme', name: 'Organic Coffee', category: 'Grocery', unitPrice: 12.49 },
  { id: 'prd_4', tenantId: 'tnt_healthplus', name: 'Vitamin C 1000mg', category: 'Supplements', unitPrice: 9.99 },
  { id: 'prd_5', tenantId: 'tnt_healthplus', name: 'Pain Relief Tablets', category: 'OTC', unitPrice: 6.49 },
  { id: 'prd_6', tenantId: 'tnt_healthplus', name: 'Hand Sanitizer', category: 'Personal Care', unitPrice: 4.99 },
];

// inventory: keyed by `${tenantId}:${storeId}:${productId}` is overkill; we store list with tenant + store.
export const inventory = [
  { id: 'inv_1', tenantId: 'tnt_acme', storeId: 'sto_1', productId: 'prd_1', quantity: 120, minQuantity: 20, maxQuantity: 200 },
  { id: 'inv_2', tenantId: 'tnt_acme', storeId: 'sto_1', productId: 'prd_2', quantity: 15, minQuantity: 10, maxQuantity: 80 },
  { id: 'inv_3', tenantId: 'tnt_acme', storeId: 'sto_1', productId: 'prd_3', quantity: 8, minQuantity: 15, maxQuantity: 100 },
  { id: 'inv_4', tenantId: 'tnt_acme', storeId: 'sto_2', productId: 'prd_3', quantity: 60, minQuantity: 20, maxQuantity: 150 },
  { id: 'inv_5', tenantId: 'tnt_healthplus', storeId: 'sto_3', productId: 'prd_4', quantity: 200, minQuantity: 50, maxQuantity: 500 },
  { id: 'inv_6', tenantId: 'tnt_healthplus', storeId: 'sto_3', productId: 'prd_5', quantity: 5, minQuantity: 30, maxQuantity: 300 },
  { id: 'inv_7', tenantId: 'tnt_healthplus', storeId: 'sto_4', productId: 'prd_6', quantity: 90, minQuantity: 25, maxQuantity: 250 },
];

export const customers = [
  { id: 'cus_1', tenantId: 'tnt_acme', name: 'John Doe', email: 'john@example.com', phone: '555-0101', address: '1 Park Ave' },
  { id: 'cus_2', tenantId: 'tnt_acme', name: 'Jane Smith', email: 'jane@example.com', phone: '555-0102', address: '2 Park Ave' },
  { id: 'cus_3', tenantId: 'tnt_healthplus', name: 'Sam Patient', email: 'sam@example.com', phone: '555-0201', address: '3 Med St' },
];

// Generate deterministic sales for the last 30 days for analytics.
function generateSales() {
  const sales = [];
  const now = new Date();
  let counter = 0;
  const tenantStores = {
    tnt_acme: [['sto_1', 'tnt_acme'], ['sto_2', 'tnt_acme']],
    tnt_healthplus: [['sto_3', 'tnt_healthplus'], ['sto_4', 'tnt_healthplus']],
  };
  const tenantProducts = {
    tnt_acme: ['prd_1', 'prd_2', 'prd_3'],
    tnt_healthplus: ['prd_4', 'prd_5', 'prd_6'],
  };
  Object.entries(tenantStores).forEach(([tenantId, stores]) => {
    stores.forEach(([storeId]) => {
      for (let d = 29; d >= 0; d--) {
        const day = new Date(now);
        day.setDate(now.getDate() - d);
        const count = 1 + ((d + storeId.length) % 4); // 1-4 sales/day, deterministic
        for (let i = 0; i < count; i++) {
          const productId = tenantProducts[tenantId][(counter + i) % tenantProducts[tenantId].length];
          const product = products.find((p) => p.id === productId);
          const qty = 1 + ((counter + i) % 3);
          const total = +(product.unitPrice * qty).toFixed(2);
          sales.push({
            id: `sale_${counter++}`,
            tenantId,
            storeId,
            customerId: null,
            items: [{ productId, quantity: qty, unitPrice: product.unitPrice, totalPrice: total }],
            totalAmount: total,
            paymentMethod: i % 2 === 0 ? 'cash' : 'card',
            status: 'completed',
            createdAt: day.toISOString(),
          });
        }
      }
    });
  });
  return sales;
}

export const sales = generateSales();

export const settings = {
  darkMode: false,
  notifications: true,
  language: 'en',
  currency: 'USD',
};

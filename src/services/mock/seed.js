// Seed data for a single-store management system (local mock backend).

export const store = {
  id: 'sto_1',
  name: 'Riverside General Store',
  type: 'retail',
  location: '123 Market St, Springfield',
  phone: '+1 555 0100',
  email: 'manager@riverside.store',
  taxId: 'TAX-99887766',
};

export const products = [
  { id: 'prd_1', sku: 'ELEC-001', name: 'Wireless Mouse', category: 'Electronics', unitPrice: 24.99, costPrice: 14.0 },
  { id: 'prd_2', sku: 'ELEC-002', name: 'Mechanical Keyboard', category: 'Electronics', unitPrice: 79.99, costPrice: 48.0 },
  { id: 'prd_3', sku: 'GROC-001', name: 'Organic Coffee 500g', category: 'Grocery', unitPrice: 12.49, costPrice: 7.2 },
  { id: 'prd_4', sku: 'GROC-002', name: 'Bottled Water 1L', category: 'Grocery', unitPrice: 1.99, costPrice: 0.8 },
  { id: 'prd_5', sku: 'HOME-001', name: 'LED Desk Lamp', category: 'Home', unitPrice: 34.5, costPrice: 19.0 },
  { id: 'prd_6', sku: 'STAT-001', name: 'Notebook A5', category: 'Stationery', unitPrice: 4.99, costPrice: 2.1 },
];

export const inventory = [
  { id: 'inv_1', productId: 'prd_1', quantity: 120, minQuantity: 20, maxQuantity: 200 },
  { id: 'inv_2', productId: 'prd_2', quantity: 15, minQuantity: 10, maxQuantity: 80 },
  { id: 'inv_3', productId: 'prd_3', quantity: 8, minQuantity: 15, maxQuantity: 100 },
  { id: 'inv_4', productId: 'prd_4', quantity: 240, minQuantity: 50, maxQuantity: 400 },
  { id: 'inv_5', productId: 'prd_5', quantity: 0, minQuantity: 5, maxQuantity: 60 },
  { id: 'inv_6', productId: 'prd_6', quantity: 90, minQuantity: 25, maxQuantity: 250 },
];

export const customers = [
  { id: 'cus_1', name: 'John Doe', email: 'john@example.com', phone: '555-0101', address: '1 Park Ave', loyaltyPoints: 120 },
  { id: 'cus_2', name: 'Jane Smith', email: 'jane@example.com', phone: '555-0102', address: '2 Park Ave', loyaltyPoints: 45 },
  { id: 'cus_3', name: 'Carlos Mendez', email: 'carlos@example.com', phone: '555-0103', address: '9 Oak Rd', loyaltyPoints: 300 },
];

export const suppliers = [
  { id: 'sup_1', name: 'TechWholesale Inc.', contact: 'Alice Lee', phone: '555-2001', email: 'supply@techwholesale.com', leadTimeDays: 5 },
  { id: 'sup_2', name: 'FreshGrocer Supply', contact: 'Bob Tan', phone: '555-2002', email: 'orders@freshgrocer.com', leadTimeDays: 2 },
  { id: 'sup_3', name: 'OfficeDepot Direct', contact: 'Cara Ng', phone: '555-2003', email: 'b2b@officedepot.com', leadTimeDays: 3 },
];

function generateSales() {
  const sales = [];
  const now = new Date();
  let counter = 0;
  const productPool = products;
  for (let d = 29; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(now.getDate() - d);
    const count = 1 + ((d + 1) % 5);
    for (let i = 0; i < count; i++) {
      const product = productPool[(counter + i) % productPool.length];
      const qty = 1 + ((counter + i) % 3);
      const total = +(product.unitPrice * qty).toFixed(2);
      sales.push({
        id: `sale_${counter++}`,
        customerId: null,
        items: [{ productId: product.id, quantity: qty, unitPrice: product.unitPrice, totalPrice: total }],
        totalAmount: total,
        paymentMethod: i % 2 === 0 ? 'cash' : 'card',
        status: 'completed',
        createdAt: day.toISOString(),
      });
    }
  }
  return sales;
}

export const sales = generateSales();

export const settings = {
  darkMode: false,
  notifications: true,
  currency: 'USD',
  lowStockAlerts: true,
  storeName: store.name,
};

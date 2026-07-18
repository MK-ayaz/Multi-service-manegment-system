// Server-side validation for IPC write handlers.
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}
function isNonNegativeInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0;
}

const validators = {
  store: (d) => {
    const e = [];
    if (!isNonEmptyString(d.name)) e.push('name is required');
    if (!isNonEmptyString(d.type)) e.push('type is required');
    return e;
  },
  product: (d) => {
    const e = [];
    if (!isNonEmptyString(d.name)) e.push('name is required');
    if (!isNonEmptyString(d.category)) e.push('category is required');
    if (!isFiniteNumber(d.unitPrice)) e.push('unitPrice must be a number');
    return e;
  },
  customer: (d) => {
    const e = [];
    if (!isNonEmptyString(d.name)) e.push('name is required');
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.push('email is invalid');
    return e;
  },
  inventory: (d) => {
    const e = [];
    if (!isNonNegativeInt(d.storeId)) e.push('storeId is required');
    if (!isNonNegativeInt(d.productId)) e.push('productId is required');
    if (!isNonNegativeInt(d.quantity)) e.push('quantity must be >= 0');
    if (!isNonNegativeInt(d.minQuantity)) e.push('minQuantity must be >= 0');
    if (!isNonNegativeInt(d.maxQuantity)) e.push('maxQuantity must be >= 0');
    return e;
  },
  sale: (d) => {
    const e = [];
    if (!isNonNegativeInt(d.storeId)) e.push('storeId is required');
    if (!Array.isArray(d.items) || d.items.length === 0) {
      e.push('items must be a non-empty array');
      return e;
    }
    d.items.forEach((it, i) => {
      if (!isNonNegativeInt(it.productId)) e.push(`items[${i}].productId required`);
      if (!isNonNegativeInt(it.quantity) || it.quantity <= 0)
        e.push(`items[${i}].quantity must be > 0`);
      if (!isFiniteNumber(it.unitPrice)) e.push(`items[${i}].unitPrice required`);
    });
    return e;
  },
};

function validate(kind, data) {
  return validators[kind] ? validators[kind](data || {}) : [];
}

module.exports = { validate, isNonEmptyString, isNonNegativeInt, isFiniteNumber };

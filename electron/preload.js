const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  theme: {
    get: () => ipcRenderer.invoke('theme:get'),
    set: (theme) => ipcRenderer.invoke('theme:set', theme),
    toggle: () => ipcRenderer.invoke('theme:toggle'),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    onMaximized: (cb) => ipcRenderer.on('window:maximized', cb),
    onUnmaximized: (cb) => ipcRenderer.on('window:unmaximized', cb),
  },
  files: {
    save: (fileName, data) => ipcRenderer.invoke('file:save', { fileName, data }),
    read: (fileName) => ipcRenderer.invoke('file:read', fileName),
    delete: (fileName) => ipcRenderer.invoke('file:delete', fileName),
    list: () => ipcRenderer.invoke('file:list'),
  },
  dashboard: {
    stats: () => ipcRenderer.invoke('dashboard:stats'),
  },
  stores: {
    create: (d) => ipcRenderer.invoke('store:create', d),
    getAll: () => ipcRenderer.invoke('store:getAll'),
    get: (id) => ipcRenderer.invoke('store:get', id),
    update: (id, d) => ipcRenderer.invoke('store:update', { id, ...d }),
    delete: (id) => ipcRenderer.invoke('store:delete', id),
  },
  inventory: {
    add: (d) => ipcRenderer.invoke('inventory:add', d),
    update: (d) => ipcRenderer.invoke('inventory:update', d),
    get: (storeId) => ipcRenderer.invoke('inventory:get', storeId),
    getProduct: (storeId, productId) =>
      ipcRenderer.invoke('inventory:getProduct', { storeId, productId }),
    remove: (storeId, productId) =>
      ipcRenderer.invoke('inventory:remove', { storeId, productId }),
  },
  products: {
    create: (d) => ipcRenderer.invoke('product:create', d),
    getAll: () => ipcRenderer.invoke('product:getAll'),
    get: (id) => ipcRenderer.invoke('product:get', id),
    update: (id, d) => ipcRenderer.invoke('product:update', { id, ...d }),
    delete: (id) => ipcRenderer.invoke('product:delete', id),
  },
  sales: {
    create: (d) => ipcRenderer.invoke('sale:create', d),
    getAll: (filters) => ipcRenderer.invoke('sale:getAll', filters),
    get: (id) => ipcRenderer.invoke('sale:get', id),
    getByStore: (storeId, filters) =>
      ipcRenderer.invoke('sale:getByStore', { storeId, ...filters }),
    void: (id) => ipcRenderer.invoke('sale:void', id),
  },
  customers: {
    create: (d) => ipcRenderer.invoke('customer:create', d),
    getAll: () => ipcRenderer.invoke('customer:getAll'),
    get: (id) => ipcRenderer.invoke('customer:get', id),
    update: (id, d) => ipcRenderer.invoke('customer:update', { id, ...d }),
    delete: (id) => ipcRenderer.invoke('customer:delete', id),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (settings) => ipcRenderer.invoke('settings:save', settings),
    getSetting: (key) => ipcRenderer.invoke('settings:getSetting', key),
    setSetting: (key, value) => ipcRenderer.invoke('settings:setSetting', { key, value }),
  },
});

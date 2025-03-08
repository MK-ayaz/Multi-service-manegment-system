const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Theme management
    theme: {
        get: () => ipcRenderer.invoke('theme:get'),
        set: (theme) => ipcRenderer.invoke('theme:set', theme),
        useSystem: () => ipcRenderer.invoke('theme:system'),
        onChanged: (callback) => ipcRenderer.on('theme:changed', (_, theme) => callback(theme))
    },

    // File system operations
    fs: {
        openFile: () => ipcRenderer.invoke('dialog:openFile'),
        saveFile: (content) => ipcRenderer.invoke('dialog:saveFile', content),
        openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
        readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
        writeFile: (path, content) => ipcRenderer.invoke('fs:writeFile', { path, content }),
        readDirectory: (path) => ipcRenderer.invoke('fs:readDirectory', path),
        onFileChange: (callback) => {
            ipcRenderer.on('file:changed', (_, path) => callback('changed', path));
            ipcRenderer.on('file:created', (_, path) => callback('created', path));
            ipcRenderer.on('file:deleted', (_, path) => callback('deleted', path));
        }
    },

    // Process management
    process: {
        start: (command, args, cwd) => ipcRenderer.invoke('process:start', { command, args, cwd }),
        stop: (processId) => ipcRenderer.invoke('process:stop', processId),
        list: () => ipcRenderer.invoke('process:list'),
        onOutput: (callback) => ipcRenderer.on('process:output', (_, data) => callback(data)),
        onExit: (callback) => ipcRenderer.on('process:exit', (_, data) => callback(data))
    },

    // Project management
    project: {
        open: () => ipcRenderer.invoke('project:open'),
        getCurrent: () => ipcRenderer.invoke('project:getCurrent'),
        onLoaded: (callback) => ipcRenderer.on('project:loaded', (_, data) => callback(data)),
        onFileChanged: (callback) => {
            ipcRenderer.on('project:file-changed', (_, path) => callback('changed', path));
            ipcRenderer.on('project:file-added', (_, path) => callback('added', path));
            ipcRenderer.on('project:file-deleted', (_, path) => callback('deleted', path));
            ipcRenderer.on('project:dir-added', (_, path) => callback('dirAdded', path));
            ipcRenderer.on('project:dir-deleted', (_, path) => callback('dirDeleted', path));
        }
    },

    // Window management
    window: {
        onMaximized: (callback) => ipcRenderer.on('window:maximized', () => callback()),
        onUnmaximized: (callback) => ipcRenderer.on('window:unmaximized', () => callback())
    }
});

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Theme management
  theme: {
    get: () => ipcRenderer.invoke('get-theme'),
    set: (theme) => ipcRenderer.invoke('set-theme', theme),
    toggle: () => ipcRenderer.invoke('toggle-theme')
  },

  // Window management
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    onMaximized: (callback) => ipcRenderer.on('window:maximized', callback),
    onUnmaximized: (callback) => ipcRenderer.on('window:unmaximized', callback)
  },

  // File system operations
  files: {
    save: (fileName, data) => ipcRenderer.invoke('file:save', { fileName, data }),
    read: (fileName) => ipcRenderer.invoke('file:read', fileName),
    delete: (fileName) => ipcRenderer.invoke('file:delete', fileName),
    list: () => ipcRenderer.invoke('file:list')
  },

  // Database operations
  db: {
    query: (sql, params) => ipcRenderer.invoke('db:query', { sql, params })
  },

  // Store operations
  stores: {
    create: (storeData) => ipcRenderer.invoke('store:create', storeData),
    getAll: () => ipcRenderer.invoke('store:getAll'),
    get: (id) => ipcRenderer.invoke('store:get', id),
    update: (id, storeData) => ipcRenderer.invoke('store:update', { id, ...storeData }),
    delete: (id) => ipcRenderer.invoke('store:delete', id)
  },

  // Inventory operations
  inventory: {
    add: (data) => ipcRenderer.invoke('inventory:add', data),
    update: (data) => ipcRenderer.invoke('inventory:update', data),
    get: (storeId) => ipcRenderer.invoke('inventory:get', storeId),
    getProduct: (storeId, productId) => ipcRenderer.invoke('inventory:getProduct', { storeId, productId }),
    remove: (storeId, productId) => ipcRenderer.invoke('inventory:remove', { storeId, productId })
  },

  // Product operations
  products: {
    create: (productData) => ipcRenderer.invoke('product:create', productData),
    getAll: () => ipcRenderer.invoke('product:getAll'),
    get: (id) => ipcRenderer.invoke('product:get', id),
    update: (id, productData) => ipcRenderer.invoke('product:update', { id, ...productData }),
    delete: (id) => ipcRenderer.invoke('product:delete', id)
  },

  // Sales operations
  sales: {
    create: (saleData) => ipcRenderer.invoke('sale:create', saleData),
    getAll: (filters) => ipcRenderer.invoke('sale:getAll', filters),
    get: (id) => ipcRenderer.invoke('sale:get', id),
    getByStore: (storeId, filters) => ipcRenderer.invoke('sale:getByStore', { storeId, ...filters }),
    void: (id) => ipcRenderer.invoke('sale:void', id)
  },

  // Customer operations
  customers: {
    create: (customerData) => ipcRenderer.invoke('customer:create', customerData),
    getAll: () => ipcRenderer.invoke('customer:getAll'),
    get: (id) => ipcRenderer.invoke('customer:get', id),
    update: (id, customerData) => ipcRenderer.invoke('customer:update', { id, ...customerData }),
    delete: (id) => ipcRenderer.invoke('customer:delete', id)
  },

  // Project operations
  project: {
    create: (projectData) => ipcRenderer.invoke('create-project', projectData),
    load: (projectId) => ipcRenderer.invoke('load-project', projectId),
    list: () => ipcRenderer.invoke('list-projects'),
    getCurrent: () => ipcRenderer.invoke('get-current-project')
  },

  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (settings) => ipcRenderer.invoke('settings:save', settings),
    getSetting: (key) => ipcRenderer.invoke('settings:getSetting', key),
    setSetting: (key, value) => ipcRenderer.invoke('settings:setSetting', { key, value }),
  },
});

const { spawn } = require('child_process');
const EventEmitter = require('events');

class ProcessManager extends EventEmitter {
  constructor() {
    super();
    this.mainWindow = null;
    this.processes = new Map();
  }

  setMainWindow(window) {
    this.mainWindow = window;
    this.initialize();
  }

  initialize() {
    if (!this.mainWindow) return;
    
    // Clean up processes when window closes
    this.mainWindow.on('closed', () => {
      this.killAllProcesses();
    });
  }

  startProcess(command, args = [], options = {}) {
    if (!this.mainWindow) return null;

    const process = spawn(command, args, {
      ...options,
      shell: true,
      env: { ...process.env, ...options.env }
    });

    const processId = Date.now().toString();
    this.processes.set(processId, process);

    process.stdout.on('data', (data) => {
      this.mainWindow.webContents.send('process:output', {
        id: processId,
        type: 'stdout',
        data: data.toString()
      });
    });

    process.stderr.on('data', (data) => {
      this.mainWindow.webContents.send('process:output', {
        id: processId,
        type: 'stderr',
        data: data.toString()
      });
    });

    process.on('close', (code) => {
      this.mainWindow.webContents.send('process:exit', {
        id: processId,
        code
      });
      this.processes.delete(processId);
    });

    return processId;
  }

  stopProcess(processId) {
    const process = this.processes.get(processId);
    if (process) {
      process.kill();
      this.processes.delete(processId);
      return true;
    }
    return false;
  }

  killAllProcesses() {
    for (const [id, process] of this.processes) {
      process.kill();
      this.processes.delete(id);
    }
  }

  getRunningProcesses() {
    return Array.from(this.processes.keys());
  }
}

module.exports = new ProcessManager();
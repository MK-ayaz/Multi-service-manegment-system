const path = require('path');
const fs = require('fs').promises;
const EventEmitter = require('events');

class ProjectManager extends EventEmitter {
  constructor() {
    super();
    this.mainWindow = null;
    this.currentProject = null;
    this.projectsPath = path.join(process.env.APPDATA || process.env.HOME, 'MultiStoreManagement/projects');
  }

  setMainWindow(window) {
    this.mainWindow = window;
  }

  async initialize() {
    try {
      await fs.mkdir(this.projectsPath, { recursive: true });
    } catch (error) {
      console.error('Error creating projects directory:', error);
    }
  }

  async createProject(projectData) {
    const { name, type, location } = projectData;
    const projectId = Date.now().toString();
    const projectPath = path.join(this.projectsPath, projectId);

    try {
      await fs.mkdir(projectPath);
      const projectConfig = {
        id: projectId,
        name,
        type,
        location,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await fs.writeFile(
        path.join(projectPath, 'config.json'),
        JSON.stringify(projectConfig, null, 2)
      );

      return projectConfig;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async loadProject(projectId) {
    try {
      const configPath = path.join(this.projectsPath, projectId, 'config.json');
      const configData = await fs.readFile(configPath, 'utf8');
      this.currentProject = JSON.parse(configData);
      
      if (this.mainWindow) {
        this.mainWindow.webContents.send('project:loaded', this.currentProject);
      }

      return this.currentProject;
    } catch (error) {
      console.error('Error loading project:', error);
      throw error;
    }
  }

  async listProjects() {
    try {
      const projects = [];
      const projectDirs = await fs.readdir(this.projectsPath);

      for (const dir of projectDirs) {
        try {
          const configPath = path.join(this.projectsPath, dir, 'config.json');
          const configData = await fs.readFile(configPath, 'utf8');
          projects.push(JSON.parse(configData));
        } catch (error) {
          console.error(`Error reading project ${dir}:`, error);
        }
      }

      return projects;
    } catch (error) {
      console.error('Error listing projects:', error);
      return [];
    }
  }

  getCurrentProject() {
    return this.currentProject;
  }
}

module.exports = new ProjectManager(); 
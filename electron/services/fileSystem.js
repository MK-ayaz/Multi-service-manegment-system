const fs = require('fs').promises
const path = require('path')

class FileSystem {
  constructor() {
    this.documentsPath = path.join(process.env.APPDATA || process.env.HOME, 'MultiStoreManagement')
  }

  async initialize() {
    try {
      await fs.mkdir(this.documentsPath, { recursive: true })
    } catch (error) {
      console.error('Error creating application directory:', error)
    }
  }

  async saveFile(fileName, data) {
    try {
      const filePath = path.join(this.documentsPath, fileName)
      await fs.writeFile(filePath, JSON.stringify(data, null, 2))
      return true
    } catch (error) {
      console.error('Error saving file:', error)
      return false
    }
  }

  async readFile(fileName) {
    try {
      const filePath = path.join(this.documentsPath, fileName)
      const data = await fs.readFile(filePath, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Error reading file:', error)
      return null
    }
  }

  async deleteFile(fileName) {
    try {
      const filePath = path.join(this.documentsPath, fileName)
      await fs.unlink(filePath)
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }

  async listFiles() {
    try {
      const files = await fs.readdir(this.documentsPath)
      return files
    } catch (error) {
      console.error('Error listing files:', error)
      return []
    }
  }
}

module.exports = new FileSystem() 
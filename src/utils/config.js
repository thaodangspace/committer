const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class ConfigManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.committer');
    this.configFile = path.join(this.configDir, 'config.json');
    this.defaultConfig = {
      providers: {
        claude: {
          enabled: true,
          command: 'claude-code',
          args: []
        },
        gemini: {
          enabled: false,
          command: 'gemini-cli',
          args: []
        },
        api: {
          enabled: false,
          endpoint: 'http://localhost:1234/v1/chat/completions',
          apiKey: '',
          model: 'gpt-3.5-turbo'
        }
      },
      defaultProvider: 'claude',
      contextFiles: {
        searchPaths: ['.', '.github', 'docs'],
        defaultFile: 'COMMITTER.md'
      },
      branch: {
        maxLength: 50,
        includePrefixes: true,
        includeTicketNumbers: true,
        separator: '/'
      },
      commit: {
        maxLength: 72,
        includeScope: true,
        conventionalCommits: true,
        includeBody: false
      }
    };
  }

  async ensureConfigDir() {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw new Error(`Failed to create config directory: ${error.message}`);
      }
    }
  }

  async loadConfig() {
    try {
      await this.ensureConfigDir();
      const configData = await fs.readFile(this.configFile, 'utf8');
      const config = JSON.parse(configData);
      return { ...this.defaultConfig, ...config };
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.saveConfig(this.defaultConfig);
        return this.defaultConfig;
      }
      throw new Error(`Failed to load config: ${error.message}`);
    }
  }

  async saveConfig(config) {
    try {
      await this.ensureConfigDir();
      await fs.writeFile(this.configFile, JSON.stringify(config, null, 2));
    } catch (error) {
      throw new Error(`Failed to save config: ${error.message}`);
    }
  }

  async get(key) {
    const config = await this.loadConfig();
    return this.getNestedProperty(config, key);
  }

  async set(key, value) {
    const config = await this.loadConfig();
    this.setNestedProperty(config, key, value);
    await this.saveConfig(config);
  }

  async list() {
    return await this.loadConfig();
  }

  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!(key in current)) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  async findContextFile(customPath) {
    if (customPath) {
      const fullPath = path.resolve(customPath);
      try {
        await fs.access(fullPath);
        return fullPath;
      } catch {
        throw new Error(`Context file not found: ${customPath}`);
      }
    }

    const config = await this.loadConfig();
    const { searchPaths, defaultFile } = config.contextFiles;

    for (const searchPath of searchPaths) {
      const filePath = path.join(searchPath, defaultFile);
      try {
        await fs.access(filePath);
        return path.resolve(filePath);
      } catch {
        continue;
      }
    }

    return null;
  }

  async readContextFile(contextPath) {
    if (!contextPath) return null;

    try {
      const content = await fs.readFile(contextPath, 'utf8');
      return {
        path: contextPath,
        content: content.trim()
      };
    } catch (error) {
      throw new Error(`Failed to read context file: ${error.message}`);
    }
  }
}

module.exports = ConfigManager;
const chalk = require('chalk');
const inquirer = require('inquirer');
const ConfigManager = require('../utils/config');

async function config(options) {
  const configManager = new ConfigManager();
  
  try {
    if (options.list) {
      return await listConfig(configManager);
    }
    
    if (options.get) {
      return await getConfig(configManager, options.get);
    }
    
    if (options.set) {
      return await setConfig(configManager, options.set);
    }
    
    return await interactiveConfig(configManager);
    
  } catch (error) {
    console.error(chalk.red('❌ Configuration error:'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

async function listConfig(configManager) {
  const config = await configManager.list();
  
  console.log(chalk.green('⚙️  Current configuration:'));
  console.log();
  console.log(chalk.cyan('Providers:'));
  
  Object.entries(config.providers).forEach(([name, settings]) => {
    const status = settings.enabled ? chalk.green('✓ enabled') : chalk.red('✗ disabled');
    console.log(`  ${name}: ${status}`);
    if (settings.command) {
      console.log(chalk.gray(`    command: ${settings.command}`));
    }
    if (settings.endpoint) {
      console.log(chalk.gray(`    endpoint: ${settings.endpoint}`));
    }
  });
  
  console.log();
  console.log(chalk.cyan('Settings:'));
  console.log(chalk.gray(`  Default provider: ${config.defaultProvider}`));
  console.log(chalk.gray(`  Context file: ${config.contextFiles.defaultFile}`));
  console.log(chalk.gray(`  Branch max length: ${config.branch.maxLength}`));
  console.log(chalk.gray(`  Commit max length: ${config.commit.maxLength}`));
  console.log(chalk.gray(`  Conventional commits: ${config.commit.conventionalCommits ? 'yes' : 'no'}`));
  console.log();
}

async function getConfig(configManager, key) {
  const value = await configManager.get(key);
  
  if (value === undefined) {
    console.log(chalk.yellow(`Configuration key '${key}' not found`));
    return;
  }
  
  console.log(chalk.green(`${key}:`));
  if (typeof value === 'object') {
    console.log(JSON.stringify(value, null, 2));
  } else {
    console.log(value);
  }
}

async function setConfig(configManager, keyValue) {
  const [key, value] = keyValue.split('=');
  
  if (!key || value === undefined) {
    console.error(chalk.red('Invalid format. Use: key=value'));
    process.exit(1);
  }
  
  let parsedValue;
  try {
    parsedValue = JSON.parse(value);
  } catch {
    parsedValue = value;
  }
  
  await configManager.set(key, parsedValue);
  console.log(chalk.green(`✓ Set ${key} = ${JSON.stringify(parsedValue)}`));
}

async function interactiveConfig(configManager) {
  const config = await configManager.list();
  
  console.log(chalk.green('⚙️  Interactive configuration'));
  console.log();
  
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What would you like to configure?',
    choices: [
      { name: 'Set default AI provider', value: 'provider' },
      { name: 'Configure Claude Code', value: 'claude' },
      { name: 'Configure Gemini CLI', value: 'gemini' },
      { name: 'Configure API endpoint', value: 'api' },
      { name: 'Set branch naming preferences', value: 'branch' },
      { name: 'Set commit message preferences', value: 'commit' },
      { name: 'Set context file settings', value: 'context' },
      { name: 'View current configuration', value: 'view' }
    ]
  }]);
  
  switch (action) {
    case 'provider':
      return await configureProvider(configManager, config);
    case 'claude':
      return await configureClaude(configManager, config);
    case 'gemini':
      return await configureGemini(configManager, config);
    case 'api':
      return await configureAPI(configManager, config);
    case 'branch':
      return await configureBranch(configManager, config);
    case 'commit':
      return await configureCommit(configManager, config);
    case 'context':
      return await configureContext(configManager, config);
    case 'view':
      return await listConfig(configManager);
  }
}

async function configureProvider(configManager, config) {
  const { provider } = await inquirer.prompt([{
    type: 'list',
    name: 'provider',
    message: 'Select default AI provider:',
    choices: [
      { name: 'Claude Code (recommended)', value: 'claude' },
      { name: 'Gemini CLI', value: 'gemini' },
      { name: 'Custom API endpoint', value: 'api' }
    ],
    default: config.defaultProvider
  }]);
  
  await configManager.set('defaultProvider', provider);
  console.log(chalk.green(`✓ Default provider set to: ${provider}`));
}

async function configureClaude(configManager, config) {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'command',
      message: 'Claude Code command:',
      default: config.providers.claude.command
    },
    {
      type: 'confirm',
      name: 'enabled',
      message: 'Enable Claude Code provider?',
      default: config.providers.claude.enabled
    }
  ]);
  
  await configManager.set('providers.claude.command', answers.command);
  await configManager.set('providers.claude.enabled', answers.enabled);
  console.log(chalk.green('✓ Claude Code configuration updated'));
}

async function configureGemini(configManager, config) {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'command',
      message: 'Gemini CLI command:',
      default: config.providers.gemini.command
    },
    {
      type: 'confirm',
      name: 'enabled',
      message: 'Enable Gemini CLI provider?',
      default: config.providers.gemini.enabled
    }
  ]);
  
  await configManager.set('providers.gemini.command', answers.command);
  await configManager.set('providers.gemini.enabled', answers.enabled);
  console.log(chalk.green('✓ Gemini CLI configuration updated'));
}

async function configureAPI(configManager, config) {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'endpoint',
      message: 'API endpoint URL:',
      default: config.providers.api.endpoint
    },
    {
      type: 'input',
      name: 'apiKey',
      message: 'API key (optional):',
      default: config.providers.api.apiKey
    },
    {
      type: 'input',
      name: 'model',
      message: 'Model name:',
      default: config.providers.api.model
    },
    {
      type: 'confirm',
      name: 'enabled',
      message: 'Enable API provider?',
      default: config.providers.api.enabled
    }
  ]);
  
  await configManager.set('providers.api.endpoint', answers.endpoint);
  await configManager.set('providers.api.apiKey', answers.apiKey);
  await configManager.set('providers.api.model', answers.model);
  await configManager.set('providers.api.enabled', answers.enabled);
  console.log(chalk.green('✓ API configuration updated'));
}

async function configureBranch(configManager, config) {
  const answers = await inquirer.prompt([
    {
      type: 'number',
      name: 'maxLength',
      message: 'Maximum branch name length:',
      default: config.branch.maxLength,
      validate: (value) => value > 0 && value <= 100
    },
    {
      type: 'confirm',
      name: 'includePrefixes',
      message: 'Include prefixes in branch names?',
      default: config.branch.includePrefixes
    },
    {
      type: 'list',
      name: 'separator',
      message: 'Preferred separator:',
      choices: ['/', '-', '_'],
      default: config.branch.separator
    }
  ]);
  
  Object.entries(answers).forEach(async ([key, value]) => {
    await configManager.set(`branch.${key}`, value);
  });
  
  console.log(chalk.green('✓ Branch configuration updated'));
}

async function configureCommit(configManager, config) {
  const answers = await inquirer.prompt([
    {
      type: 'number',
      name: 'maxLength',
      message: 'Maximum commit subject length:',
      default: config.commit.maxLength,
      validate: (value) => value > 0 && value <= 100
    },
    {
      type: 'confirm',
      name: 'conventionalCommits',
      message: 'Use conventional commit format?',
      default: config.commit.conventionalCommits
    },
    {
      type: 'confirm',
      name: 'includeScope',
      message: 'Include scope in commit messages?',
      default: config.commit.includeScope
    },
    {
      type: 'confirm',
      name: 'includeBody',
      message: 'Generate commit body when needed?',
      default: config.commit.includeBody
    }
  ]);
  
  Object.entries(answers).forEach(async ([key, value]) => {
    await configManager.set(`commit.${key}`, value);
  });
  
  console.log(chalk.green('✓ Commit configuration updated'));
}

async function configureContext(configManager, config) {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'defaultFile',
      message: 'Default context filename:',
      default: config.contextFiles.defaultFile
    },
    {
      type: 'input',
      name: 'searchPaths',
      message: 'Search paths (comma-separated):',
      default: config.contextFiles.searchPaths.join(','),
      filter: (value) => value.split(',').map(s => s.trim())
    }
  ]);
  
  await configManager.set('contextFiles.defaultFile', answers.defaultFile);
  await configManager.set('contextFiles.searchPaths', answers.searchPaths);
  console.log(chalk.green('✓ Context file configuration updated'));
}

module.exports = config;
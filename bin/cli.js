#!/usr/bin/env node

const { program } = require('commander');
const { generateBranch, generateCommit, config } = require('../src/commands');
const pkg = require('../package.json');

program
  .name('committer')
  .description('AI-powered branch name and commit message generator')
  .version(pkg.version);

program
  .command('branch')
  .description('Generate a branch name based on git history and context')
  .option('-p, --provider <provider>', 'AI provider (claude, gemini, api)', 'claude')
  .option('-c, --context <file>', 'Context file (.md) for additional information')
  .action(generateBranch);

program
  .command('commit')
  .description('Generate a commit message based on staged changes')
  .option('-p, --provider <provider>', 'AI provider (claude, gemini, api)', 'claude')
  .option('-c, --context <file>', 'Context file (.md) for additional information')
  .option('-a, --auto-stage', 'Automatically stage all changes before generating commit')
  .action(generateCommit);

program
  .command('config')
  .description('Configure AI providers and settings')
  .option('-s, --set <key=value>', 'Set configuration value')
  .option('-g, --get <key>', 'Get configuration value')
  .option('-l, --list', 'List all configuration')
  .action(config);

program.parse();
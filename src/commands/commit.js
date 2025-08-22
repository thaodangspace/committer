const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const GitAnalyzer = require('../utils/git');
const ConfigManager = require('../utils/config');
const { getAIProvider } = require('../providers');
const { generateCommitMessageFallback } = require('../utils/fallback');

async function generateCommit(options) {
  const spinner = ora('Analyzing changes...').start();
  
  try {
    const git = new GitAnalyzer();
    const config = new ConfigManager();
    
    if (options.autoStage) {
      spinner.text = 'Staging changes...';
      await git.stageAllChanges();
    }
    
    const [stagedChanges, detailedDiff, recentCommits, contextFile] = await Promise.all([
      git.getStagedChanges(),
      git.getDetailedDiff(true),
      git.getRecentCommits(5),
      config.findContextFile(options.context)
    ]);
    
    if (stagedChanges.length === 0) {
      spinner.stop();
      console.log(chalk.yellow('⚠️  No staged changes found.'));
      
      const unstagedChanges = await git.getUnstagedChanges();
      if (unstagedChanges.length > 0) {
        console.log(chalk.gray('Unstaged changes detected:'));
        unstagedChanges.forEach(change => {
          console.log(chalk.gray(`  ${change.status}: ${change.file}`));
        });
        console.log();
        
        const { shouldStage } = await inquirer.prompt([{
          type: 'confirm',
          name: 'shouldStage',
          message: 'Stage all changes and generate commit message?',
          default: true
        }]);
        
        if (shouldStage) {
          spinner.start('Staging changes...');
          await git.stageAllChanges();
          const newStagedChanges = await git.getStagedChanges();
          const newDetailedDiff = await git.getDetailedDiff(true);
          return generateCommitMessage(newStagedChanges, newDetailedDiff, recentCommits, contextFile, options, config, spinner);
        }
      }
      
      console.log(chalk.red('Nothing to commit. Stage some changes first.'));
      process.exit(1);
    }
    
    return generateCommitMessage(stagedChanges, detailedDiff, recentCommits, contextFile, options, config, spinner);
    
  } catch (error) {
    spinner.stop();
    console.error(chalk.red('❌ Error generating commit message:'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

async function generateCommitMessage(stagedChanges, detailedDiff, recentCommits, contextFile, options, config, spinner) {
  try {
    spinner.text = 'Reading context...';
    const context = await config.readContextFile(contextFile);
    
    spinner.text = 'Generating commit message...';
    let suggestions;
    try {
      const provider = await getAIProvider(options.provider || 'claude', config);
      const prompt = buildCommitPrompt(stagedChanges, detailedDiff, recentCommits, context);
      suggestions = await provider.generateCommitMessage(prompt);
    } catch (err) {
      console.warn(chalk.yellow('⚠️  AI provider unavailable, using basic commit message.'));
      suggestions = generateCommitMessageFallback(stagedChanges);
    }

    spinner.stop();
    
    console.log(chalk.green('📝 Commit message suggestions:'));
    console.log();
    
    suggestions.forEach((suggestion, index) => {
      console.log(chalk.cyan(`${index + 1}. ${suggestion.message}`));
      if (suggestion.body) {
        console.log(chalk.gray('   Body:'));
        suggestion.body.split('\n').forEach(line => {
          console.log(chalk.gray(`   ${line}`));
        });
      }
      if (suggestion.type) {
        console.log(chalk.gray(`   Type: ${suggestion.type}`));
      }
      console.log();
    });
    
    console.log(chalk.yellow('📋 Staged changes:'));
    stagedChanges.forEach(change => {
      const icon = getChangeIcon(change.status);
      console.log(chalk.gray(`  ${icon} ${change.file}`));
    });
    console.log();
    
    console.log(chalk.yellow('💡 Tips:'));
    console.log(chalk.gray('• Copy the commit message you prefer'));
    console.log(chalk.gray('• Commit with: git commit -m "<message>"'));
    console.log(chalk.gray('• Or use: git commit and paste in your editor'));
    console.log();
    
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function buildCommitPrompt(stagedChanges, detailedDiff, recentCommits, context) {
  let prompt = `Generate a commit message based on the following staged changes:

STAGED CHANGES:
${stagedChanges.map(change => `- ${change.status}: ${change.file}`).join('\n')}

DETAILED DIFF:
\`\`\`diff
${detailedDiff.slice(0, 2000)}${detailedDiff.length > 2000 ? '\n... (truncated)' : ''}
\`\`\`

RECENT COMMIT HISTORY (for style reference):
${recentCommits.map(commit => `- ${commit.message}`).join('\n')}`;

  if (context) {
    prompt += `\n\nADDITIONAL CONTEXT (from ${context.path}):\n${context.content}`;
  }

  prompt += `\n\nPlease generate 3-4 commit message suggestions that:
1. Follow conventional commit format if the repo uses it
2. Are concise but descriptive (max 72 characters for subject)
3. Match the style of recent commits in this repository
4. Accurately describe what was changed and why
5. Use appropriate commit types (feat, fix, docs, style, refactor, test, chore)

Return as JSON array with objects containing:
- 'message': the commit subject line
- 'body': optional longer description (if needed)
- 'type': the commit type used`;

  return prompt;
}

function getChangeIcon(status) {
  const icons = {
    'added': '✅',
    'modified': '📝',
    'deleted': '❌',
    'renamed': '➡️',
    'copied': '📋',
    'typechange': '🔄',
    'unmerged': '⚠️'
  };
  return icons[status] || '📄';
}

module.exports = generateCommit;
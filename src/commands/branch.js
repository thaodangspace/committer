const chalk = require("chalk");
const ora = require("ora");
const GitAnalyzer = require("../utils/git");
const ConfigManager = require("../utils/config");
const { getAIProvider } = require("../providers");

async function generateBranch(options) {
  const spinner = ora("Analyzing repository...").start();

  try {
    const git = new GitAnalyzer();
    const config = new ConfigManager();

    const [repoInfo, contextFile] = await Promise.all([
      git.getRepositoryInfo(),
      config.findContextFile(options.context),
    ]);

    spinner.text = "Reading context...";
    const context = await config.readContextFile(contextFile);

    spinner.text = "Generating branch name...";
    const provider = await getAIProvider(options.provider || "claude", config);

    const prompt = buildBranchPrompt(repoInfo, context);
    const suggestions = await provider.generateBranchName(prompt);

    spinner.stop();

    console.log(chalk.green("🌿 Branch name suggestions:"));
    console.log();

    suggestions.forEach((suggestion, index) => {
      console.log(chalk.cyan(`${index + 1}. ${suggestion.name}`));
      if (suggestion.description) {
        console.log(chalk.gray(`   ${suggestion.description}`));
      }
      console.log();
    });

    console.log(chalk.yellow("💡 Tips:"));
    console.log(chalk.gray("• Copy the branch name you prefer"));
    console.log(chalk.gray("• Create with: git checkout -b <branch-name>"));
    console.log();
  } catch (error) {
    spinner.stop();
    console.error(chalk.red("❌ Error generating branch name:"));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

function buildBranchPrompt(repoInfo, context) {
  let prompt = `Generate a branch name based on the following repository information:

REPOSITORY CONTEXT:
- Current branch: ${repoInfo.currentBranch}
- Repository path: ${repoInfo.repoPath}

RECENT COMMITS:
${repoInfo.recentCommits
  .slice(0, 5)
  .map((commit) => `- ${commit.message} (${commit.author})`)
  .join("\n")}

BRANCH NAMING PATTERNS:
- Has prefixes: ${repoInfo.branchPattern.hasPrefix}
- Common prefixes: ${repoInfo.branchPattern.prefixes.join(", ") || "none"}
- Separator: ${repoInfo.branchPattern.separator}
- Uses ticket numbers: ${repoInfo.branchPattern.hasTicketNumbers}
- Conventions: ${repoInfo.branchPattern.conventions.join(", ") || "none"}

CURRENT STATUS:
- Files changed: ${repoInfo.status.files?.length || 0}
- Branch ahead: ${repoInfo.status.ahead || 0}
- Branch behind: ${repoInfo.status.behind || 0}`;

  if (context) {
    prompt += `\n\nADDITIONAL CONTEXT (from ${context.path}):\n${context.content}`;
  }

  prompt += `\n\nPlease generate 3-5 branch name suggestions that:
1. Follow the existing naming conventions from this repository
2. Are descriptive but concise (max 50 characters)
3. Use appropriate prefixes if the repo uses them
4. Include ticket numbers if that's the pattern
5. Are lowercase with appropriate separators

Return as JSON array with objects containing 'name' and 'description' fields.`;

  return prompt;
}

module.exports = generateBranch;


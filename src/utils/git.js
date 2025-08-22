const simpleGit = require('simple-git');
const path = require('path');

class GitAnalyzer {
  constructor(repoPath = process.cwd()) {
    this.git = simpleGit(repoPath);
    this.repoPath = repoPath;
  }

  async getRecentCommits(count = 10) {
    try {
      const log = await this.git.log({ maxCount: count });
      return log.all.map(commit => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        date: commit.date,
        refs: commit.refs
      }));
    } catch (error) {
      throw new Error(`Failed to get git history: ${error.message}`);
    }
  }

  async getCurrentBranch() {
    try {
      const status = await this.git.status();
      return status.current;
    } catch (error) {
      throw new Error(`Failed to get current branch: ${error.message}`);
    }
  }

  async getStagedChanges() {
    try {
      const diff = await this.git.diff(['--cached', '--name-status']);
      return this.parseDiffOutput(diff);
    } catch (error) {
      throw new Error(`Failed to get staged changes: ${error.message}`);
    }
  }

  async getUnstagedChanges() {
    try {
      const diff = await this.git.diff(['--name-status']);
      return this.parseDiffOutput(diff);
    } catch (error) {
      throw new Error(`Failed to get unstaged changes: ${error.message}`);
    }
  }

  async getDetailedDiff(staged = true) {
    try {
      const args = staged ? ['--cached'] : [];
      const diff = await this.git.diff(args);
      return diff;
    } catch (error) {
      throw new Error(`Failed to get detailed diff: ${error.message}`);
    }
  }

  async stageAllChanges() {
    try {
      await this.git.add('.');
      return true;
    } catch (error) {
      throw new Error(`Failed to stage changes: ${error.message}`);
    }
  }

  async getBranchPattern() {
    try {
      const branches = await this.git.branch();
      const branchNames = branches.all.filter(name => 
        !name.startsWith('remotes/') && name !== branches.current
      );
      
      return this.analyzeBranchNamingPattern(branchNames);
    } catch (error) {
      throw new Error(`Failed to analyze branch patterns: ${error.message}`);
    }
  }

  parseDiffOutput(diff) {
    if (!diff.trim()) return [];
    
    return diff.trim().split('\n').map(line => {
      const [status, ...fileParts] = line.split('\t');
      const file = fileParts.join('\t');
      return {
        status: this.mapDiffStatus(status),
        file
      };
    });
  }

  mapDiffStatus(status) {
    const statusMap = {
      'A': 'added',
      'M': 'modified',
      'D': 'deleted',
      'R': 'renamed',
      'C': 'copied',
      'U': 'unmerged',
      'T': 'typechange'
    };
    return statusMap[status] || 'unknown';
  }

  analyzeBranchNamingPattern(branches) {
    const patterns = {
      hasPrefix: false,
      prefixes: [],
      separator: '/',
      hasTicketNumbers: false,
      conventions: []
    };

    if (branches.length === 0) return patterns;

    branches.forEach(branch => {
      if (branch.includes('/')) {
        patterns.hasPrefix = true;
        const prefix = branch.split('/')[0];
        if (!patterns.prefixes.includes(prefix)) {
          patterns.prefixes.push(prefix);
        }
      }

      if (branch.includes('-')) {
        patterns.separator = '-';
      }

      if (/\d+/.test(branch)) {
        patterns.hasTicketNumbers = true;
      }

      if (branch.startsWith('feature/') || branch.startsWith('feat/')) {
        patterns.conventions.push('feature');
      } else if (branch.startsWith('fix/') || branch.startsWith('bugfix/')) {
        patterns.conventions.push('fix');
      } else if (branch.startsWith('hotfix/')) {
        patterns.conventions.push('hotfix');
      } else if (branch.startsWith('release/')) {
        patterns.conventions.push('release');
      } else if (branch.startsWith('develop') || branch.startsWith('dev/')) {
        patterns.conventions.push('develop');
      }
    });

    patterns.conventions = [...new Set(patterns.conventions)];
    return patterns;
  }

  async getRepositoryInfo() {
    try {
      const remotes = await this.git.getRemotes(true);
      const status = await this.git.status();
      const currentBranch = await this.getCurrentBranch();
      const recentCommits = await this.getRecentCommits(5);
      const branchPattern = await this.getBranchPattern();

      return {
        remotes,
        status,
        currentBranch,
        recentCommits,
        branchPattern,
        repoPath: this.repoPath
      };
    } catch (error) {
      throw new Error(`Failed to get repository info: ${error.message}`);
    }
  }
}

module.exports = GitAnalyzer;
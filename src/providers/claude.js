const { spawn } = require('child_process');
const BaseProvider = require('./base');

class ClaudeProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.command = config.command || 'claude-code';
  }

  async generateBranchName(prompt) {
    const fullPrompt = `${prompt}\n\nRespond only with valid JSON array format containing branch name suggestions.`;
    const response = await this.executeClaudeCommand(fullPrompt);
    this.validateResponse(response, 'branch');
    return this.parseResponse(response, 'branch');
  }

  async generateCommitMessage(prompt) {
    const fullPrompt = `${prompt}\n\nRespond only with valid JSON array format containing commit message suggestions.`;
    const response = await this.executeClaudeCommand(fullPrompt);
    this.validateResponse(response, 'commit');
    return this.parseResponse(response, 'commit');
  }

  async executeClaudeCommand(prompt) {
    return new Promise((resolve, reject) => {
      const args = [...(this.config.args || [])];
      const claude = spawn(this.command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      claude.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      claude.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      claude.on('close', (code) => {
        if (code !== 0) {
          const error = stderr || `Claude Code exited with code ${code}`;
          reject(new Error(`Claude Code error: ${error}`));
          return;
        }

        if (!stdout.trim()) {
          reject(new Error('No output from Claude Code'));
          return;
        }

        resolve(stdout.trim());
      });

      claude.on('error', (error) => {
        if (error.code === 'ENOENT') {
          reject(new Error(`Claude Code command not found: ${this.command}. Install it or configure the correct command with 'committer config'`));
        } else {
          reject(new Error(`Failed to execute Claude Code: ${error.message}`));
        }
      });

      claude.stdin.write(prompt);
      claude.stdin.end();
    });
  }

  parseResponse(response, type) {
    try {
      const cleanResponse = this.cleanClaudeResponse(response);
      return super.parseResponse(cleanResponse, type);
    } catch (error) {
      console.warn('Claude response parsing failed, using fallback');
      return super.fallbackParse(response, type);
    }
  }

  cleanClaudeResponse(response) {
    let cleaned = response.trim();
    
    cleaned = cleaned.replace(/^Here are.*?suggestions?:?\s*/im, '');
    cleaned = cleaned.replace(/^I'll.*?suggestions?:?\s*/im, '');
    cleaned = cleaned.replace(/^Based on.*?:\s*/im, '');
    
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1];
    }
    
    return cleaned;
  }
}

module.exports = ClaudeProvider;
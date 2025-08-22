const { spawn } = require('child_process');
const BaseProvider = require('./base');

class GeminiProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.command = config.command || 'gemini-cli';
  }

  async generateBranchName(prompt) {
    const fullPrompt = `${prompt}\n\nRespond only with valid JSON array format containing branch name suggestions.`;
    const response = await this.executeGeminiCommand(fullPrompt);
    this.validateResponse(response, 'branch');
    return this.parseResponse(response, 'branch');
  }

  async generateCommitMessage(prompt) {
    const fullPrompt = `${prompt}\n\nRespond only with valid JSON array format containing commit message suggestions.`;
    const response = await this.executeGeminiCommand(fullPrompt);
    this.validateResponse(response, 'commit');
    return this.parseResponse(response, 'commit');
  }

  async executeGeminiCommand(prompt) {
    return new Promise((resolve, reject) => {
      const args = [...(this.config.args || [])];
      const gemini = spawn(this.command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      gemini.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      gemini.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      gemini.on('close', (code) => {
        if (code !== 0) {
          const error = stderr || `Gemini CLI exited with code ${code}`;
          reject(new Error(`Gemini CLI error: ${error}`));
          return;
        }

        if (!stdout.trim()) {
          reject(new Error('No output from Gemini CLI'));
          return;
        }

        resolve(stdout.trim());
      });

      gemini.on('error', (error) => {
        if (error.code === 'ENOENT') {
          reject(new Error(`Gemini CLI command not found: ${this.command}. Install it or configure the correct command with 'committer config'`));
        } else {
          reject(new Error(`Failed to execute Gemini CLI: ${error.message}`));
        }
      });

      gemini.stdin.write(prompt);
      gemini.stdin.end();
    });
  }

  parseResponse(response, type) {
    try {
      const cleanResponse = this.cleanGeminiResponse(response);
      return super.parseResponse(cleanResponse, type);
    } catch (error) {
      console.warn('Gemini response parsing failed, using fallback');
      return super.fallbackParse(response, type);
    }
  }

  cleanGeminiResponse(response) {
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

module.exports = GeminiProvider;
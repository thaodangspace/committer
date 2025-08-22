class BaseProvider {
  constructor(config) {
    this.config = config;
  }

  async generateBranchName(prompt) {
    throw new Error('generateBranchName method must be implemented by provider');
  }

  async generateCommitMessage(prompt) {
    throw new Error('generateCommitMessage method must be implemented by provider');
  }

  parseResponse(response, type = 'branch') {
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (parsed.suggestions || parsed.results) {
        return parsed.suggestions || parsed.results;
      }
      return [parsed];
    } catch (error) {
      console.warn('Failed to parse JSON response, attempting fallback parsing');
      return this.fallbackParse(response, type);
    }
  }

  fallbackParse(response, type) {
    const lines = response.split('\n').filter(line => line.trim());
    
    if (type === 'branch') {
      return lines
        .filter(line => line.match(/^\d+\.|^-|^\*/) || line.includes('feature/') || line.includes('fix/'))
        .slice(0, 5)
        .map((line, index) => ({
          name: this.extractBranchName(line),
          description: `Generated suggestion ${index + 1}`
        }));
    } else {
      return lines
        .filter(line => line.length > 10 && !line.includes('```'))
        .slice(0, 4)
        .map((line, index) => ({
          message: this.cleanCommitMessage(line),
          type: this.detectCommitType(line)
        }));
    }
  }

  extractBranchName(line) {
    const cleaned = line.replace(/^\d+\.\s*|^-\s*|^\*\s*/, '').trim();
    return cleaned.split(' ')[0] || cleaned;
  }

  cleanCommitMessage(line) {
    return line
      .replace(/^\d+\.\s*|^-\s*|^\*\s*/, '')
      .replace(/^['"`]|['"`]$/g, '')
      .trim()
      .slice(0, 72);
  }

  detectCommitType(message) {
    const types = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'];
    const lowerMessage = message.toLowerCase();
    
    for (const type of types) {
      if (lowerMessage.includes(type)) {
        return type;
      }
    }
    
    if (lowerMessage.includes('add') || lowerMessage.includes('new')) return 'feat';
    if (lowerMessage.includes('fix') || lowerMessage.includes('bug')) return 'fix';
    if (lowerMessage.includes('update') || lowerMessage.includes('change')) return 'chore';
    if (lowerMessage.includes('remove') || lowerMessage.includes('delete')) return 'chore';
    if (lowerMessage.includes('test')) return 'test';
    if (lowerMessage.includes('doc')) return 'docs';
    
    return 'feat';
  }

  validateResponse(response, type) {
    if (!response || typeof response !== 'string') {
      throw new Error('Invalid response from AI provider');
    }
    
    if (response.length < 10) {
      throw new Error('Response too short from AI provider');
    }
    
    return true;
  }
}

module.exports = BaseProvider;
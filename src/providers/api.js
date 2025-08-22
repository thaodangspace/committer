const axios = require('axios');
const BaseProvider = require('./base');

class APIProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-3.5-turbo';
    
    if (!this.endpoint) {
      throw new Error('API endpoint is required for API provider');
    }
  }

  async generateBranchName(prompt) {
    const fullPrompt = `${prompt}\n\nRespond only with valid JSON array format containing branch name suggestions.`;
    const response = await this.callAPI(fullPrompt);
    this.validateResponse(response, 'branch');
    return this.parseResponse(response, 'branch');
  }

  async generateCommitMessage(prompt) {
    const fullPrompt = `${prompt}\n\nRespond only with valid JSON array format containing commit message suggestions.`;
    const response = await this.callAPI(fullPrompt);
    this.validateResponse(response, 'commit');
    return this.parseResponse(response, 'commit');
  }

  async callAPI(prompt) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const payload = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates git branch names and commit messages. Always respond with valid JSON arrays.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      };

      const response = await axios.post(this.endpoint, payload, {
        headers,
        timeout: 30000
      });

      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        throw new Error('Invalid response format from API');
      }

      const content = response.data.choices[0].message?.content;
      if (!content) {
        throw new Error('No content in API response');
      }

      return content.trim();

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to API endpoint: ${this.endpoint}. Check if the service is running.`);
      } else if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error?.message || error.response.statusText;
        throw new Error(`API error (${status}): ${message}`);
      } else if (error.code === 'ENOTFOUND') {
        throw new Error(`API endpoint not found: ${this.endpoint}`);
      } else {
        throw new Error(`API request failed: ${error.message}`);
      }
    }
  }

  parseResponse(response, type) {
    try {
      const cleanResponse = this.cleanAPIResponse(response);
      return super.parseResponse(cleanResponse, type);
    } catch (error) {
      console.warn('API response parsing failed, using fallback');
      return super.fallbackParse(response, type);
    }
  }

  cleanAPIResponse(response) {
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

module.exports = APIProvider;
const ClaudeProvider = require('./claude');
const GeminiProvider = require('./gemini');
const APIProvider = require('./api');

async function getAIProvider(providerName, configManager) {
  const config = await configManager.loadConfig();
  const providerConfig = config.providers[providerName];
  
  if (!providerConfig) {
    throw new Error(`Provider '${providerName}' not found in configuration`);
  }
  
  if (!providerConfig.enabled) {
    throw new Error(`Provider '${providerName}' is disabled. Enable it with: committer config`);
  }
  
  switch (providerName) {
    case 'claude':
      return new ClaudeProvider(providerConfig);
    case 'gemini':
      return new GeminiProvider(providerConfig);
    case 'api':
      return new APIProvider(providerConfig);
    default:
      throw new Error(`Unsupported provider: ${providerName}`);
  }
}

module.exports = {
  getAIProvider,
  ClaudeProvider,
  GeminiProvider,
  APIProvider
};
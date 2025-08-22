# Committer

A smart CLI tool that generates intelligent branch names and commit messages using AI providers like Claude Code, Gemini CLI, or custom API endpoints.

## Features

- 🤖 **AI-Powered**: Integrates with Claude Code, Gemini CLI, or custom APIs
- 🌿 **Smart Branch Names**: Analyzes git history to suggest contextual branch names
- 📝 **Intelligent Commits**: Generates commit messages based on staged changes
- 🎯 **Context Aware**: Uses project-specific context from `.md` files
- ⚙️ **Configurable**: Customizable providers, formats, and conventions
- 🔄 **Pattern Recognition**: Learns from existing repository naming patterns

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd committer

# Install dependencies
npm install

# Link globally (optional)
npm link
```

## Quick Start

```bash
# Generate branch name suggestions
committer branch

# Generate commit message for staged changes
committer commit

# Auto-stage changes and generate commit message
committer commit --auto-stage

# Use a specific AI provider
committer branch --provider gemini
committer commit --provider api

# Use custom context file
committer branch --context ./docs/project-info.md
```

## Configuration

Configure AI providers and preferences:

```bash
# Interactive configuration
committer config

# Set specific values
committer config --set defaultProvider=claude
committer config --set providers.api.endpoint=http://localhost:1234/v1/chat/completions

# View current configuration
committer config --list
```

### Supported Providers

#### Claude Code
```bash
# Default configuration
committer config --set providers.claude.command=claude-code
committer config --set providers.claude.enabled=true
```

#### Gemini CLI
```bash
# Configure Gemini CLI
committer config --set providers.gemini.command=gemini-cli
committer config --set providers.gemini.enabled=true
```

#### Custom API (OpenAI-compatible)
```bash
# Configure API endpoint (e.g., LM Studio, Ollama)
committer config --set providers.api.endpoint=http://localhost:1234/v1/chat/completions
committer config --set providers.api.model=gpt-3.5-turbo
committer config --set providers.api.enabled=true
```

## Context Files

Create a `COMMITTER.md` file in your project root to provide context:

```markdown
# Project Context

## Conventions
- Use feature/ prefix for new features
- Include ticket numbers: feature/JIRA-123-description
- Keep branch names under 50 characters

## Current Work
Working on user authentication system with OAuth integration.
```

The tool will automatically find context files in:
- Current directory (`./COMMITTER.md`)
- `.github/` directory
- `docs/` directory

## Commands

### `committer branch`

Generate branch name suggestions based on git history and context.

**Options:**
- `-p, --provider <provider>`: AI provider (claude, gemini, api)
- `-c, --context <file>`: Custom context file path

**Example:**
```bash
committer branch --provider claude --context ./docs/context.md
```

### `committer commit`

Generate commit message suggestions for staged changes.

**Options:**
- `-p, --provider <provider>`: AI provider (claude, gemini, api)  
- `-c, --context <file>`: Custom context file path
- `-a, --auto-stage`: Automatically stage all changes

**Example:**
```bash
committer commit --auto-stage --provider api
```

### `committer config`

Configure the tool settings and AI providers.

**Options:**
- `-s, --set <key=value>`: Set configuration value
- `-g, --get <key>`: Get configuration value  
- `-l, --list`: List all configuration

**Examples:**
```bash
committer config --list
committer config --set defaultProvider=gemini
committer config --get providers.claude.command
```

## Examples

### Branch Generation Output
```
🌿 Branch name suggestions:

1. feature/user-authentication-oauth
   OAuth integration for user login system

2. feature/auth-system-setup  
   Initial setup of authentication infrastructure

3. feat/oauth-integration
   Add OAuth provider support
```

### Commit Generation Output
```
📝 Commit message suggestions:

1. feat(auth): add OAuth integration for user authentication
   Type: feat

2. feat: implement user authentication with OAuth providers  
   Type: feat

3. add OAuth authentication system
   Type: feat

📋 Staged changes:
  ✅ src/auth/oauth.js
  📝 src/components/Login.js
  ✅ package.json
```

## Configuration File

The configuration is stored in `~/.committer/config.json`:

```json
{
  "providers": {
    "claude": {
      "enabled": true,
      "command": "claude-code",
      "args": []
    },
    "gemini": {
      "enabled": false,
      "command": "gemini-cli",
      "args": []
    },
    "api": {
      "enabled": false,
      "endpoint": "http://localhost:1234/v1/chat/completions",
      "apiKey": "",
      "model": "gpt-3.5-turbo"
    }
  },
  "defaultProvider": "claude",
  "contextFiles": {
    "searchPaths": [".", ".github", "docs"],
    "defaultFile": "COMMITTER.md"
  },
  "branch": {
    "maxLength": 50,
    "includePrefixes": true,
    "separator": "/"
  },
  "commit": {
    "maxLength": 72,
    "conventionalCommits": true,
    "includeScope": true
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Test CLI locally
./bin/cli.js branch
./bin/cli.js commit --help
```

## Troubleshooting

### Provider Not Found
```
Error: Claude Code command not found: claude-code
```
**Solution**: Install the provider or configure the correct command:
```bash
committer config --set providers.claude.command=/path/to/claude-code
```

### No Context File
The tool works without context files, but they improve suggestions. Create a `COMMITTER.md` file in your project root for better results.

### API Connection Issues
```
Error: Cannot connect to API endpoint
```
**Solution**: Verify the API service is running and the endpoint URL is correct:
```bash
committer config --set providers.api.endpoint=http://localhost:1234/v1/chat/completions
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`  
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request
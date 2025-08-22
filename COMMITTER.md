# Committer Context

This is a context file for the Committer CLI tool. You can customize this file to provide additional context for AI-generated branch names and commit messages.

## Project Information

- **Project Name**: Committer CLI
- **Type**: Node.js CLI tool for Git automation
- **Purpose**: Generate intelligent branch names and commit messages using AI

## Conventions

### Branch Naming
- Use descriptive names that indicate the type of work
- Include ticket/issue numbers when available
- Use lowercase with hyphens or slashes as separators
- Keep under 50 characters

Example patterns:
- `feature/user-authentication`
- `fix/login-validation-bug`
- `hotfix/security-patch`
- `docs/update-readme`

### Commit Messages
- Follow conventional commit format when possible
- Use present tense ("add" not "added")
- Keep subject line under 72 characters
- Include scope when relevant

Example formats:
- `feat(auth): add user login functionality`
- `fix(api): resolve timeout issue in user service`
- `docs: update installation instructions`
- `refactor(utils): simplify config validation`

## AI Guidance

When generating suggestions:
1. Analyze the git history to understand existing patterns
2. Consider the scope and impact of changes
3. Use appropriate prefixes based on change type
4. Be concise but descriptive
5. Follow the project's established conventions

## Custom Instructions

Add any project-specific requirements, coding standards, or preferences here:

- Prefer specific feature names over generic terms
- Include component/module names in scope when relevant  
- Use imperative mood for commit messages
- Consider the target audience (developers, stakeholders, etc.)

## Examples

Good branch names:
- `feature/payment-integration`
- `fix/mobile-responsive-layout`
- `chore/update-dependencies`

Good commit messages:
- `feat(payment): integrate Stripe payment processing`
- `fix(ui): resolve mobile layout overflow issue`
- `chore: update npm dependencies to latest versions`
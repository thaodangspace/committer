function generateCommitMessageFallback(changes) {
  if (!changes || changes.length === 0) {
    return [{ message: 'chore: update files', type: 'chore' }];
  }

  const statuses = changes.map(c => c.status);
  const files = changes.map(c => c.file);

  let type = 'chore';
  let action = 'update';

  if (statuses.every(s => s === 'added')) {
    type = 'feat';
    action = 'add';
  } else if (statuses.every(s => s === 'deleted')) {
    action = 'remove';
  }

  const target = files.length === 1 ? files[0] : `${files.length} files`;
  const message = `${type}: ${action} ${target}`.slice(0, 72);

  return [{ message, type }];
}

function generateBranchNameFallback(repoInfo = {}) {
  const prefix = repoInfo.branchPattern?.prefixes?.[0] || 'feature';
  let base = 'new-branch';

  if (repoInfo.recentCommits && repoInfo.recentCommits[0]) {
    base = repoInfo.recentCommits[0].message
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);
  }

  const name = `${prefix}/${base}`.slice(0, 50);
  return [{ name, description: 'Basic branch name suggestion' }];
}

module.exports = {
  generateCommitMessageFallback,
  generateBranchNameFallback
};

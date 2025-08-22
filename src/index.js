const { program } = require('commander');

if (require.main === module) {
  require('../bin/cli.js');
}

module.exports = {
  generateBranch: require('./commands/branch'),
  generateCommit: require('./commands/commit'),
  config: require('./commands/config')
};
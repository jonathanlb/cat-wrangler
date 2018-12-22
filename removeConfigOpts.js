// Roll back configuration options to the default from git repo.

const sh = require('shelljs');

if (!sh.which('git')) {
  sh.echo('No git in path');
  sh.exit(1);
}

const code = sh.exec('git checkout -- src/client/config.js src/server/config.js');
sh.exit(code);

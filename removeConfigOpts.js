// Roll back configuration options to the default from git repo.

const sh = require('shelljs');

if (!sh.which('git')) {
  sh.echo('No git in path');
  sh.exit(1);
}

const configFiles = 'public/about.html public/favicon.ico public/header-mascot.png public/override-style.css src/client/config.js src/server/config.js';

const code = sh.exec(`git checkout -- ${configFiles}`);
sh.exit(code);

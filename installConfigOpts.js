// Overwrite the default configuration options using the
// serverConfig and clientConfig files in config/

const sh = require('shelljs');

sh.cp('config/clientConfig.js', 'src/client/config.js');
sh.cp('config/serverConfig.js', 'src/server/config.js');

if (sh.test('-e', 'config/about.html')) {
  sh.cp('config/about.html', 'public/about.html');
}


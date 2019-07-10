// Overwrite the default configuration options using the
// serverConfig and clientConfig files in config/

const sh = require('shelljs');

if (sh.test('-e', 'config/clientConfig.js')) {
  sh.cp('config/clientConfig.js', 'src/client/config.js');
}
if (sh.test('-e', 'config/serverConfig.js')) {
  sh.cp('config/serverConfig.js', 'src/server/config.js');
}

[
  'about.html',
  'favicon.ico',
  'header-mascot.png',
  'override-style.css'
].forEach(i => {
  if (sh.test('-e', `config/${i}`)) {
    sh.cp(`config/${i}`, `public/${i}`);
  }
});

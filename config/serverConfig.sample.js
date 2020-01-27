// Local server configuration options.
// 'npm run config' will write this file to config/serverConfig.js
// 'npm run unconfig' will restore this file using git.

const Mailer = require('./mail');
const mailer = new Mailer({
    from: 'admin@your.site.org',
    site: 'https://rsvp-here@your.site.org',
    subject: 'Password Reset Request',
    transport: {
      sendmail: true,
      newline: 'unix',
      path: '/usr/sbin/sendmail'
    }
  }
);

module.exports = {
  allowCORS: true,
  auth: {
    method: 'simple-auth',
    dbFileName: 'data/users.db',
    privateKeyFileName: 'data/jwtRS256.key',
    publicKeyFileName: 'data/jwtRS256.key.pub',
    deliverPasswordReset: mailer.sendPasswordReset
  },
  httpPort: 3010, // leave undefined to force https
  httpsOpts: { // leave undefined if you cannot run https
    caFile: './config/chain.pem',
    certFile: './config/server.crt.pem',
    keyFile: './config/server.key.pem',
    port: 3011,
  },
  sqliteTimekeeper: {
    file: 'data/db.sqlite3',
  },
}

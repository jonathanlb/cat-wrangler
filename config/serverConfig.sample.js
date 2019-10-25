// Local server configuration options.
// 'npm run config' will write this file to config/serverConfig.js
// 'npm run unconfig' will restore this file using git.

module.exports = {
  allowCORS: true,
	auth: {
		method: 'default',
		dbFileName: ':memory:'
	},
  email: 'admin@your.host.com',
  httpPort: 3010, // leave undefined to force https
  httpsOpts: { // leave undefined if you cannot run https
    caFile: './config/chain.pem',
    certFile: './config/server.crt.pem',
    keyFile: './config/server.key.pem',
    port: 3011,
  },
  mailConfig: {
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail',
  },
  siteTitle: 'Title for site header',
  siteURL: 'http://your.host.com', // used for password reset email
  sqliteTimekeeper: {
    file: 'data/db.sqlite3',
  },
}

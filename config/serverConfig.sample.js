// Local server configuration options.
// 'npm run config' will write this file to config/serverConfig.js
// 'npm run unconfig' will restore this file using git.

module.exports = {
  allowCORS: true,
	auth: {
    method: 'simple-auth',
    dbFileName: 'data/users.db',
    privateKeyFileName: 'data/jwtRS256.key',
    publicKeyFileName: 'data/jwtRS256.key.pub',
	},
  email: 'admin@your.host.com',
  httpPort: 3010, // leave undefined to force https
  httpsOpts: { // leave undefined if you cannot run https
    caFile: './config/chain.pem',
    certFile: './config/server.crt.pem',
    keyFile: './config/server.key.pem',
    port: 3011,
  },
  siteTitle: 'Title for site header',
  siteURL: 'http://your.host.com', // used for password reset email
  sqliteTimekeeper: {
    file: 'data/db.sqlite3',
  },
}

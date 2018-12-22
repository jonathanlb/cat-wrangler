// Placeholder for server configuration options.
// 'npm run config' will overwrite this file with the options
// in config/serverConfig.js
// 'npm run unconfig' will restore this file using git.

module.exports = {
  allowCORS: true,
  email: 'bredin@acm.org', // reply-to for mailing
  httpPort: 3000,
  httpsOpts: {
    caFile: undefined,
    certFile: undefined,
    keyFile: undefined,
    port: undefined,
  },
  mailConfig: {
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail',
  },
  siteTitle: 'Cat Wranger RSVP', // for password reset email
  siteURL: 'http://192.168.1.4:3000', // for password reset email
  sqliteTimekeeper: {
    file: 'data/rsvps.sqlite3',
  },
};

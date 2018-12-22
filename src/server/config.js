// Placeholder for client configuration options.
// 'npm run config' will overwrite this file with the options
// in config/clientConfig.js
// 'npm run unconfig' will restore this file using git.

module.exports = {
  allowCORS: true,
  email: 'bredin@acm.org',
  httpPort: 3000,
  httpsPort: 3011,
  mailConfig: {
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail',
  },
  siteTitle: 'Cat Wranger RSVP',
  siteURL: 'http://192.168.1.4:3000',
  sqliteTimekeeper: {
    file: 'data/mmo.sqlite3',
  },
}

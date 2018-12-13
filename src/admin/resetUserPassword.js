// Reset a user password.
// Example:
// DEBUG='admin' node src/admin/resetUserPassword.js data/mydb.sqlite3 \
//   'Jonathan Bredin' 'secret stuff'

const bcrypt = require('bcrypt');
const debug = require('debug')('admin');

const dbs = require('../server/dbs');
const AbstractTimekeeper = require('../server/timekeeper');

const dbFile = process.argv[2];
const userName = process.argv[3];
const newPassword = process.argv[4];

const saltRounds = 10;

const db = new dbs.SQLite(
  dbFile,
  dbs.sqlite3.OPEN_CREATE | dbs.sqlite3.OPEN_READWRITE, // eslint-disable-line
  (err) => {
    if (err) {
      console.error(`cannot open db at ${dbFile}: ${err.message}`); // eslint-disable-line
      process.exit(1);
    }
    debug('open OK', err);
  },
);

bcrypt.hash(newPassword, saltRounds).
  then((hash) => {
    const query = `UPDATE participants SET secret='${hash}', recovery=NULL ` +
      `WHERE name='${AbstractTimekeeper.escapeQuotes(userName)}'`;
    debug('update', query);
    return db.allAsync(query).
      then((result) => {
        debug('OK', result);
      });
  });

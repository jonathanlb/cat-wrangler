// Reset a user password.
// Example:
// DEBUG='admin' node src/admin/resetUserPassword.js data/mydb.sqlite3 \
//   'Jonathan Bredin' 'secret stuff'

const bcrypt = require('bcrypt');
const debug = require('debug')('admin');

const dbs = require('../server/dbs');

if (process.argv.length < 4) {
  // eslint-disable-next-line
  console.error('USAGE: <db-file> <user-name> <new-password>');
  process.exit(2);
}
const dbFile = process.argv[2];
const userName = process.argv[3];
const newPassword = process.argv[4];

const saltRounds = 10;

debug('opening db', dbFile);
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

debug('hashing for', userName);
bcrypt.hash(newPassword, saltRounds).
  then(async (hash) => {
    let query = `SELECT rowid, name FROM participants WHERE name LIKE '%${userName}%'`;
    debug('userId', query);
    const userIdResult = await db.allAsync(query);
    if (!userIdResult || userIdResult.length !== 1) {
      // eslint-disable-next-line no-throw-literal
      throw `Invalid/non-unique user name ${userName} : ${userIdResult.map(x => x.name)}`;
    }
    debug('userId', userIdResult);
    const userId = userIdResult[0].rowid;

    query = `UPDATE participants SET secret='${hash}', recovery=NULL ` +
      `WHERE rowid=${userId}`;
    debug('update', query);
    const result = await db.allAsync(query);
    debug('OK', result);
  });

// Apply sqlite3-promise/bluebird-promisify until sqlite3-promise updates deps.
// From https://github.com/Aminadav/node-sqlite3-promise
const sqlite3 = require('sqlite3');
sqlite3.Database.prototype = require('bluebird').promisifyAll(require('sqlite3').Database.prototype);

const sqlite3F = sqlite3.verbose();

module.exports = {
  SQLite: sqlite3F.Database,
  sqlite3,
};

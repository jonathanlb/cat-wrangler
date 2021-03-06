// Create a new event and insert it into a sqlite3 db.
// Usage: node src/admin/createEvent.js myEvent.json data/db.sqlite3
//
// Example event configuration file contents:
// {
//   "name": "Extravaganza",
//   "venue": {
//     "name": "The Dive",
//     "address": "37 Lake St"
//     /* alternatively, you can specify the venue id e.g. "id": 37
//   },
//   "description": "# Best Test Event Evuh\nRSVP or ....",
//   "dates": [
//     { "yyyymmdd": "2018-12-01", "hhmm": "8:39", "duration": "45m" },
//     { "yyyymmdd": "2018-12-01", "hhmm": "9:06", "duration": "45m" }
//   ]
// }
const EventCreator = require('./eventCreator');

const eventConfigFile = process.argv[2];
const serverOpts = require('../server/config');

const serverConfig = {
  auth: {
    method: 'simple-auth',
    dbFileName: ':memory:',
    privateKeyFileName: serverOpts.auth.privateKeyFileName,
    publicKeyFileName: serverOpts.auth.publicKeyFileName,
  },
  sqliteTimekeeper: serverOpts.sqliteTimekeeper,
};

EventCreator.parseEventConfig(eventConfigFile).
  then((eventConfig) => {
    const ec = new EventCreator(serverConfig);
    return ec.run(eventConfig).
      then(() => ec.close());
  });

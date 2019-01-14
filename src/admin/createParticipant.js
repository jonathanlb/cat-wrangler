// Insert a new user into a sqlite3 db.
// Usage: DEBUG='*' node src/admin/createParticipant.js db.sqlite3 \
//   participant-name password email organizer-true-false section-name
//
// Reading from command line, and starting up db from scratch for one insert
// takes about 340ms on my laptop.
// Consider reading stdin....

const express = require('express');
const Server = require('../server/server');

if (process.argv.length < 6) {
  // eslint-disable-next-line
  console.error('Usage: db-file name password email [section] [organizer]');
  process.exit(-1);
}

const sqliteFile = process.argv[2];
const participantName = process.argv[3];
const password = process.argv[4];
const email = process.argv[5];
const section = process.argv[6] || '';
const organizer = process.argv[7] === 'true';

const serverConfig = {
  router: express(),
  sqliteTimekeeper: {
    file: sqliteFile,
  },
};

const server = new Server(serverConfig);
server.setup().
  then(() => server.timekeeper.createParticipant(
    participantName, password, { email, organizer, section },
  )).
  then(() => server.close());

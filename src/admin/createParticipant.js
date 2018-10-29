// Insert a new user into a sqlite3 db.
// Usage: node src/admin/createParticipant.js db.sqlite3 \
//   participant-name password organizer-true-false section-name
//
// Reading from command line, and starting up db from scratch for one insert
// takes about 340ms on my laptop.
// Consider reading stdin....

const express = require('express');
const Server = require('../server/server');

const sqliteFile = process.argv[2];
const participantName = process.argv[3];
const password = process.argv[4];
const organizer = process.argv[5] === 'true';
const section = process.argv[6] || '';

const serverConfig = {
  router: express(),
  sqliteTimekeeper: {
    file: sqliteFile,
  },
};

const server = new Server(serverConfig);
server.setup().
  then(() => server.timekeeper.createParticipant(
    participantName, password, { organizer, section },
  )).
  then(() => server.close());

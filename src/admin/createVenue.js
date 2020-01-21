// Insert a new user into a sqlite3 db.
// Usage: node src/admin/createVenue.js db.sqlite3 venue-name venue-address
//
// Example reading venues from bash from file:
// while read i ; do
//   eval node src/admin/createVenue.js data/mmo.sqlite3 $i
// done < venues.txt
//
// The above operation takes about 250ms per line on my laptop.

const express = require('express');
const Server = require('../server/server');

const sqliteFile = process.argv[2];
const venueName = process.argv[3];
const venueAddress = process.argv[4];

const serverConfig = {
  auth: {
    method: 'simple-auth', // stub
    dbFileName: ':memory:',
  },
  router: express(),
  sqliteTimekeeper: {
    file: sqliteFile,
  },
};

const server = new Server(serverConfig);
server.setup().
  then(() => server.timekeeper.createVenue(
    venueName, venueAddress,
  )).
  then(() => server.close());

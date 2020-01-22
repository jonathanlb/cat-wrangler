const express = require('express');
const Server = require('../server/server');

module.exports = class VenueCreator {
  constructor(venueDbFileName) {
    const serverConfig = {
      auth: {
        method: 'simple-auth', // stub
        dbFileName: ':memory:',
      },
      router: express(),
      sqliteTimekeeper: {
        file: venueDbFileName,
      },
    };
    this.server = new Server(serverConfig);
  }

  async close() {
    return this.server.close();
  }

  async run(venueName, venueAddress) {
    await this.server.setup();
    await this.server.timekeeper.createVenue(venueName, venueAddress);
  }
};

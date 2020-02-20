const debug = require('debug')('eventCreator');
const express = require('express');
const fs = require('promise-fs'); // eslint-disable-line
const Server = require('../server/server');

module.exports = class EventCreator {
  constructor(serverConfig) {
    serverConfig.router = express(); // eslint-disable-line
    debug('new', serverConfig);
    this.server = new Server(serverConfig);
  }

  close() {
    if (this.server) {
      this.server.close();
      this.server = undefined;
    }
  }

  static async parseEventConfig(fileName) {
    debug('reading event config', fileName);
    return fs.readFile(fileName).
      then(f => JSON.parse(f.toString().trim()));
  }

  async run(eventConfig) {
    let tk;
    debug('run', eventConfig);

    return this.server.setup().then((server) => {
      tk = server.timekeeper;
      if (!eventConfig.venue.id) {
        return tk.createVenue(
          eventConfig.venue.name, eventConfig.venue.address,
        ).
          catch((e) => {
            throw e;
          });
      }
      return eventConfig.venue.id;
    }).then(venueId => tk.createEvent(
      eventConfig.name, venueId, eventConfig.description,
    )).
      then(eventId => Promise.all(
        eventConfig.dates.map((date) => {
          debug('date', date);
          return tk.createDateTime(
            eventId, date.yyyymmdd, date.hhmm, date.duration,
          );
        }),
      ));
  }
};

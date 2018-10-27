const debug = require('debug')('eventCreator');
const express = require('express');
const fs = require('promise-fs');
const Server = require('../server/server');

module.exports = class EventCreator {
  constructor(serverConfig) {
    serverConfig.router = express();
    this.server = new Server(serverConfig);
  }

  close() {
    this.server && this.server.close();
    this.server = undefined;
  }

  static async parseEventConfig(fileName) {
    debug('reading event config', fileName);
    return fs.readFile(fileName).
      then((f) =>
        JSON.parse(f.toString().trim()));
  }

  async run(eventConfig) {
    let timekeeper;

    return this.server.setup().then((server) => {
      timekeeper = server.timekeeper;
      if (!eventConfig.venue.id) {
        return timekeeper.createVenue(
          eventConfig.venue.name, eventConfig.venue.address).
          catch((e) => {
            throw e;
          });
      } else {
        return eventConfig.venue.id;
      }
    }).then((venueId) =>
      timekeeper.createEvent(
        eventConfig.name, venueId, eventConfig.description)).
      then((eventId) => Promise.all(
        eventConfig.dates.map((date) => {
          debug('date', date);
          return timekeeper.createDateTime(
            eventId, date.yyyymmdd, date.hhmm, date.duration);
        })));
  }
};

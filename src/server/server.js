const debug = require('debug')('server');
const errors = require('debug')('server:error');
const express = require('express');
const SqliteTimekeeper = require('./sqliteTimekeeper');

module.exports = class Server {
  constructor(opts) {
    this.router = opts.router;
    this.timekeeper = opts.timekeeper
      || new SqliteTimekeeper(opts.sqliteTimekeeper || {});
  }

  badUserPassword(res) {
    return res.status(401).send('bad user id or password');
  }

  close() {
      this.timekeeper && this.timekeeper.close();
      this.timekeeper = undefined;
  }

  async setup() {
    return this.timekeeper.setup().
      then(() => this.setupEventGet()).
      then(() => this.setupEventSummary()).
      then(() => this.setupRsvp()).
      then(() => this.setupUserGet()).
      then(() => this.setupVenueGet()).
      then(() => this);
  }

  setupEventGet() {
    // handle search after possibly inserting missing query from route.
    // Do we unify route with odd regexp? SO indicates confusion among users and
    // express versions.
    const searchEvents = async (secret, id, query) => {
      return this.timekeeper.checkSecret(id, secret).
      then((checked) => {
        if (checked) {
          return this.timekeeper.getEvents(query).
            then((result) =>
              res.status(200).send(JSON.stringify(result)));
        } else {
          this.badUserPassword(res);
        }
      });
    }

    this.router.get(
      '/event/list/:secret/:id',
      (req, res) => {
        const { secret, id } = req;
        debug('events list', id);
        return searchEvents(secret, parseInt(id), {});
      });

    this.router.get(
      '/event/list/:secret/:id/:query',
      (req, res) => {
        const { secret, id, query } = req;
        const queryObj = JSON.parse(query);
        debug('events query', id, query);
        return searchEvents(secret, parseInt(id), queryObj);
      });
  }

  setupEventSummary() {
    this.router.get(
      '/event/summary/:secret/:userId/:eventId',
      (req, res) => {
        const { secret } = req;
        const userId = parseInt(req.userId);
        const eventId = parseInt(req.eventId);
        return this.timekeeper.checkSecret(userId, secret).
          then((checked) => {
            if (checked) {
              return this.timekeeper.collectRsvps(eventId, 0).
                then((rsvps) =>
                  res.status(200).send(JSON.stringify(rsvps)));
            } else {
              return this.badUserPassword(res);
            }
          });
      });

    this.router.get(
      '/event/detail/:secret/:userId/:eventId',
      (req, res) => {
        const { secret } = req;
        const userId = parseInt(req.userId);
        const eventId = parseInt(req.eventId);
        return this.timekeeper.checkSecret(userId, secret).
          then((checked) => {
            if (checked) {
              return this.timekeeper.collectRsvps(eventId, userId).
                then((rsvps) =>
                  res.status(200).send(JSON.stringify(rsvps)));
            } else {
              return this.badUserPassword(res);
            }
          });
      });
  }

  setupRsvp() {
    this.router.get(
      '/event/rsvp/:secret/:userId/:eventId/:dateTimeId/:rsvp',
      (req, res) => {
        const { secret } = req;
        const userId = parseInt(req.userId);
        const eventId = parseInt(req.eventId);
        const dateTimeId = parseInt(req.dateTimeId);
        const rsvp = parseInt(req.rsvp);
        return this.timekeeper.checkSecret(userId, secret).
          then((checked) => {
            if (checked) {
              return this.timekeeper.rsvp(eventId, userId, dateTimeId, rsvp).
                then(() => res.status(200).send('OK'));
            } else {
              return this.badUserPassword(res);
            }
          });
      });
  }

  setupUserGet() {
    this.router.get(
      '/user/bootstrap/:secret/:userName',
      (req, res) => {
        let userId;
        const { secret, userName } = req;
        debug('bootstrap user id get', userName);
        this.timekeeper.getUserId(userName).
          then((id) => {
            userId = id;
            return this.timekeeper.checkSecret(userId, secret);
          }).then((checked) => {
            if (checked) {
              res.status(200).send(id.toString());
            } else {
              this.badUserPassword(res);
            }
          });
      },
    );

    this.router.get(
      '/user/get/:secret/:userId/:whoId',
      (req, res) => {
        const { secret, userId, whoId } = req;
        debug('get user info', userId, whoId);
        this.timekeeper.checkSecret(userId, secret).
        then((checked) => {
          if (checked) {
            this.timekeeper.getUserInfo(whoId).
              then((info) =>
                res.status(200).send(JSON.stringify(info)));
          } else {
            this.badUserPassword(res);
          }
        });
      },
    );

    this.router.get(
      '/user/get/:secret/:userId/:whoName',
      (req, res) => {
        const { secret, userId, whoName } = req;
        debug('get user id', userId, whoName);
        this.timekeeper.checkSecret(userId, secret).
        then((checked) => {
          if (checked) {
            this.timekeeper.getUserId(whoName).
              then((id) => {
                if (id) {
                  res.status(200).send(id.toString());
                } else {
                  res.status(404).send(`not found: ${whoName}`);
                }
              });
          } else {
            this.badUserPassword(res);
          }
        });
      },
    );
  }

  setupVenueGet() {
    // see setupEventGet comment on route unification
    const searchVenues = async (secret, id, query) => {
      return this.timekeeper.checkSecret(id, secret).
      then((checked) => {
        if (checked) {
          return this.timekeeper.getVenues(query).
            then((result) =>
              res.status(200).send(JSON.stringify(result)));
        } else {
          this.badUserPassword(res);
        }
      });
    }

    this.router.get(
      '/venue/list/:secret/:id',
      (req, res) => {
        const { secret, id } = req;
        debug('venue list', id);
        return searchEvents(secret, id, {});
      });

    this.router.get(
      '/venue/list/:secret/:id/:query',
      (req, res) => {
        const { secret, id, query } = req;
        const queryObj = JSON.parse(query);
        debug('venue query', id, query);
        return searchVenues(secret, id, queryObj);
      });
  }
};

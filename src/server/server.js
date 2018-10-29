const debug = require('debug')('server');
const errors = require('debug')('server:error');
const SqliteTimekeeper = require('./sqliteTimekeeper');

module.exports = class Server {
  constructor(opts) {
    this.router = opts.router;
    this.timekeeper = opts.timekeeper ||
      new SqliteTimekeeper(opts.sqliteTimekeeper || {});
  }

  static badUserPassword(res) {
    return res.status(401).send('bad user id or password');
  }

  close() {
    if (this.timekeeper) {
      this.timekeeper.close();
      this.timekeeper = undefined;
    }
  }

  async setup() {
    return this.timekeeper.setup().
      then(() => this.setupDatetimeGet()).
      then(() => this.setupEventGet()).
      then(() => this.setupEventSummary()).
      then(() => this.setupRsvp()).
      then(() => this.setupUserGet()).
      then(() => this.setupVenueGet()).
      then(() => this);
  }

  setupDatetimeGet() {
    this.router.get(
      '/datetime/get/:secret/:userId/:dateTimeId',
      (req, res) => {
        const { secret } = req.params;
        const userId = parseInt(req.params.userId, 10);
        const dateTimeId = parseInt(req.params.dateTimeId, 10);
        debug('datetime get', userId);
        return this.timekeeper.checkSecret(userId, secret).
          then((checked) => {
            if (checked) {
              return this.timekeeper.getDatetime(dateTimeId).
                then(result => res.status(200).send(JSON.stringify(result)));
            }
            return Server.badUserPassword(res);
          }).
          catch((err) => {
            errors('datetime get', err.message);
            return res.status(500).send('get datetime failure');
          });
      },
    );
  }

  setupEventGet() {
    // handle search after possibly inserting missing query from route.
    // Do we unify route with odd regexp? SO indicates confusion among users and
    // express versions.
    const searchEvents = async (res, secret, id, query) => this.timekeeper.checkSecret(id, secret).
      then((checked) => {
        if (checked) {
          return this.timekeeper.getEvents(query).
            then(result => res.status(200).send(JSON.stringify(result)));
        }
        return Server.badUserPassword(res);
      }).
      catch((err) => {
        errors('searchEvent', err.message);
        return res.status(500).send('search failure');
      });

    this.router.get(
      '/event/list/:secret/:userId',
      (req, res) => {
        const { secret, userId } = req.params;
        debug('events list', userId);
        return searchEvents(
          res, secret, parseInt(userId, 10), {},
        );
      },
    );

    this.router.get(
      '/event/list/:secret/:id/:query',
      (req, res) => {
        const { secret, id, query } = req.params;
        const queryObj = JSON.parse(query);
        debug('events query', id, query);
        return searchEvents(
          res, secret, parseInt(id, 10), queryObj,
        );
      },
    );
  }

  setupEventSummary() {
    this.router.get(
      '/event/summary/:secret/:userId/:eventId',
      (req, res) => {
        const { secret } = req.params;
        const userId = parseInt(req.params.userId, 10);
        const eventId = parseInt(req.params.eventId, 10);
        return this.timekeeper.checkSecret(userId, secret).
          then((checked) => {
            if (checked) {
              return this.timekeeper.collectRsvps(eventId, 0).
                then(rsvps => res.status(200).send(JSON.stringify(rsvps)));
            }
            return Server.badUserPassword(res);
          }).
          catch((error) => {
            errors('eventSummary', error.message);
            res.status(500).send('summarize failure');
          });
      },
    );

    this.router.get(
      '/event/detail/:secret/:userId/:eventId',
      (req, res) => {
        const { secret } = req.params;
        const userId = parseInt(req.params.userId, 10);
        const eventId = parseInt(req.params.eventId, 10);
        return this.timekeeper.checkSecret(userId, secret).
          then((checked) => {
            if (checked) {
              return this.timekeeper.collectRsvps(eventId, userId).
                then(rsvps => res.status(200).send(JSON.stringify(rsvps)));
            }
            return Server.badUserPassword(res);
          });
      },
    );
  }

  setupRsvp() {
    this.router.get(
      '/event/rsvp/:secret/:userId/:eventId/:dateTimeId/:rsvp',
      (req, res) => {
        const { secret } = req.params;
        const userId = parseInt(req.params.userId, 10);
        const eventId = parseInt(req.params.eventId, 10);
        const dateTimeId = parseInt(req.params.dateTimeId, 10);
        const rsvp = parseInt(req.params.rsvp, 10);
        debug('rsvp', userId, eventId, dateTimeId, rsvp);
        return this.timekeeper.checkSecret(userId, secret).
          then((checked) => {
            if (checked) {
              return this.timekeeper.rsvp(eventId, userId, dateTimeId, rsvp).
                then(() => res.status(200).send('OK'));
            }
            return Server.badUserPassword(res);
          }).
          catch((err) => {
            errors('rsvp', err.message);
            res.status(500).send('rsvp error');
          });
      },
    );

    this.router.get(
      '/event/rsvp/:secret/:userId/:eventId',
      (req, res) => {
        const { secret } = req.params;
        const userId = parseInt(req.params.userId, 10);
        const eventId = parseInt(req.params.eventId, 10);
        debug('get-rsvp', userId, eventId);
        return this.timekeeper.checkSecret(userId, secret).
          then((checked) => {
            if (checked) {
              return this.timekeeper.getRsvps(eventId, userId).
                then(result => res.status(200).send(JSON.stringify(result)));
            }
            return Server.badUserPassword(res);
          }).
          catch((err) => {
            errors('get-rsvp', err.message);
            res.status(500).send('get-rsvp error');
          });
      },
    );
  }

  setupUserGet() {
    this.router.get(
      '/user/bootstrap/:secret/:userName',
      (req, res) => {
        let userId;
        const { secret, userName } = req.params;
        debug('bootstrap user id get', userName);
        this.timekeeper.getUserId(userName).
          then((id) => {
            userId = id;
            return this.timekeeper.checkSecret(userId, secret);
          }).then((checked) => {
            if (checked) {
              res.status(200).send(userId.toString());
            } else {
              Server.badUserPassword(res);
            }
          });
      },
    );

    this.router.get(
      '/user/get/:secret/:userId/:whoId',
      (req, res) => {
        const { secret, userId, whoId } = req.params;
        debug('get user info', userId, whoId);
        this.timekeeper.checkSecret(userId, secret).
          then((checked) => {
            if (checked) {
              this.timekeeper.getUserInfo(whoId).
                then(info => res.status(200).send(JSON.stringify(info)));
            } else {
              Server.badUserPassword(res);
            }
          }).
          catch((e) => {
            errors('get user info', e);
            res.status(500).send('cannot lookup user info');
          });
      },
    );

    this.router.get(
      '/user/id/:secret/:userId/:whoName',
      (req, res) => {
        const { secret, userId, whoName } = req.params;
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
              Server.badUserPassword(res);
            }
          });
      },
    );
  }

  setupVenueGet() {
    // see setupEventGet comment on route unification
    const searchVenues = async (res, secret, id, query) => this.timekeeper.checkSecret(id, secret).
      then((checked) => {
        if (checked) {
          return this.timekeeper.getVenues(query).
            then(result => res.status(200).send(JSON.stringify(result)));
        }
        return Server.badUserPassword(res);
      });

    this.router.get(
      '/venue/list/:secret/:id',
      (req, res) => {
        const { secret, id } = req.params;
        debug('venue list', id);
        return searchVenues(res, secret, id, {});
      },
    );

    this.router.get(
      '/venue/list/:secret/:id/:query',
      (req, res) => {
        const { secret, id, query } = req.params;
        const queryObj = JSON.parse(query);
        debug('venue query', id, query);
        return searchVenues(res, secret, id, queryObj);
      },
    );
  }
};

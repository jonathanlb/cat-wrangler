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
    await this.timekeeper.setup();
    this.setupDatetimeGet();
    this.setupEventGet();
    this.setupEventSummary();
    this.setupNevers();
    this.setupPasswordChange();
    this.setupRsvp();
    this.setupUpdateSection();
    this.setupUserGet();
    this.setupVenueGet();
    return this;
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

    this.router.get(
      '/event/get/:secret/:id/:eventId',
      (req, res) => {
        const { secret, id, eventId } = req.params;
        debug('events get', id, eventId);
        return this.timekeeper.checkSecret(parseInt(id, 10), secret).
          then((checked) => {
            if (checked) {
              return this.timekeeper.getEvent(parseInt(eventId, 10), id).
                then((result) => {
                  debug('events got', result);
                  if (result) {
                    return res.status(200).send(JSON.stringify(result));
                  }
                  return res.status(404).send();
                });
            }
            return Server.badUserPassword(res);
          }).
          catch((err) => {
            errors('getEvent', err.message);
            return res.status(500).send('event lookup failure');
          });
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

  setupNevers() {
    this.router.get(
      '/event/never/:secret/:userId/:dateStr',
      async (req, res) => {
        const { secret, dateStr } = req.params;
        const userId = parseInt(req.params.userId, 10);
        debug('never', userId, dateStr);
        const checked = await this.timekeeper.checkSecret(userId, secret);
        if (checked) {
          await this.timekeeper.never(userId, dateStr);
          return res.status(200).send('OK');
        }
        return Server.badUserPassword(res);
      },
    );

    this.router.get(
      '/event/nevers/:secret/:userId',
      async (req, res) => {
        const { secret } = req.params;
        const userId = parseInt(req.params.userId, 10);
        const checked = await this.timekeeper.checkSecret(userId, secret);
        if (checked) {
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
          debug('nevers', userId, todayStr);
          const nevers = await this.timekeeper.getNevers(userId, todayStr);
          return res.status(200).send(JSON.stringify(nevers));
        }
        return Server.badUserPassword(res);
      },
    );
  }

  setupPasswordChange() {
    this.router.get(
      '/password/change/:secret/:userId/:newPassword',
      async (req, res) => {
        const { secret, newPassword } = req.params;
        const userId = parseInt(req.params.userId, 10);
        const checked = await this.timekeeper.checkSecret(userId, secret);
        if (checked) {
          await this.timekeeper.changePassword(userId, newPassword);
          return res.status(200).send('OK');
        }
        return Server.badUserPassword(res);
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

  setupUpdateSection() {
    this.router.get(
      '/user/update-section/:secret/:userId/:newSection',
      async (req, res) => {
        const { secret, newSection } = req.params;
        const userId = parseInt(req.params.userId, 10);
        debug('update-section', userId, newSection);
        const checked = await this.timekeeper.checkSecret(userId, secret);
        if (checked) {
          const updatedSection = await this.timekeeper.updateUserSection(userId, newSection);
          debug('updatedSection', updatedSection);
          return res.status(200).send(updatedSection);
        }
        return Server.badUserPassword(res);
      },
    );
  }

  setupUserGet() {
    this.router.get(
      '/user/bootstrap/:secret/:userName',
      async (req, res) => {
        const { secret, userName } = req.params;
        debug('bootstrap user id get', userName);
        const userId = await this.timekeeper.getUserId(userName);
        const checked = await this.timekeeper.checkSecret(userId, secret);
        if (checked) {
          const userInfo = await this.timekeeper.getUserInfo(userId);
          res.status(200).send(JSON.stringify(userInfo));
        } else {
          Server.badUserPassword(res);
        }
      },
    );

    this.router.get(
      '/user/get/:secret/:userId/:whoId',
      (req, res) => {
        const { secret } = req.params;
        const userId = parseInt(req.params.userId, 10);
        const whoId = parseInt(req.params.whoId, 10);
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
        const { secret, whoName } = req.params;
        const userId = parseInt(req.params.userId, 10);
        debug('get user id', userId, whoName);
        this.timekeeper.checkSecret(userId, secret).
          then((checked) => {
            if (checked) {
              this.timekeeper.getUserId(whoName).
                then((id) => {
                  if (id && id > 0) {
                    res.status(200).send(id.toString());
                  } else {
                    res.status(404).send(`not found: ${whoName}`);
                  }
                });
            } else {
              Server.badUserPassword(res);
            }
          }).
          catch((err) => {
            errors('userid get', err.message);
            return res.status(500).send('get userid failure');
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
      }).
      catch((err) => {
        errors('venue search', err.message);
        return res.status(500).send('search venue failure');
      });

    this.router.get(
      '/venue/get/:secret/:id/:venueId',
      (req, res) => {
        const { secret } = req.params;
        const id = parseInt(req.params.id, 10);
        const venueId = parseInt(req.params.venueId, 10);
        debug('venue get', id, venueId);
        return this.timekeeper.checkSecret(id, secret).
          then((checked) => {
            if (checked) {
              return this.timekeeper.getVenues({ id: venueId }).
                then((result) => {
                  if (result && result.length) {
                    return res.status(200).send(JSON.stringify(result[0]));
                  }
                  return res.status(404).send(`venue ${venueId} not found`);
                });
            }
            return Server.badUserPassword(res);
          }).
          catch((err) => {
            errors('venue get', err.message);
            return res.status(500).send('get venue failure');
          });
      },
    );

    // discourage this call?
    this.router.get(
      '/venue/list/:secret/:id',
      (req, res) => {
        const { secret } = req.params;
        const id = parseInt(req.params.id, 10);
        debug('venue list', id);
        return searchVenues(res, secret, id, {});
      },
    );

    this.router.get(
      '/venue/list/:secret/:id/:query',
      (req, res) => {
        const { secret, query } = req.params;
        const id = parseInt(req.params.id, 10);
        const queryObj = JSON.parse(query);
        debug('venue query', id, query);
        return searchVenues(res, secret, id, queryObj);
      },
    );
  }
};

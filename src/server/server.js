const debug = require('debug')('server');
const errors = require('debug')('server:error');
const SqliteTimekeeper = require('./sqliteTimekeeper');
const dt = require('../client/dateTimes');

module.exports = class Server {
  /**
   * @param opts Configuration options:
   *  - auth Authentication configuration, e.g. Simple-Auth config.
   *  - router Express.js router
   *  - timekeeper
   */
  constructor(opts) {
    this.router = opts.router;
    this.timekeeper = opts.timekeeper ||
      new SqliteTimekeeper(opts.sqliteTimekeeper || {});
    this.setAuth(opts.auth);
  }

  async checkAuth(request, response, userId) {
    const rawSecret = request.headers['x-access-token'];
    if (!rawSecret || rawSecret.length <= 0 || userId === undefined) {
      errors('checkAuth no credentials');
      response.status(401).send('Unauthorized');
      return false;
    }

    const secret = decodeURIComponent(rawSecret);
    try {
      const sessionOK = await this.authSession(userId, secret);
      debug('checkAuth session', sessionOK);
      if (sessionOK) {
        // TODO: update session?
        return true;
      }
    } catch (e) {
      errors('checkAuth session', e.message);
      response.status(440).send('Session expired');
      return false;
    }

    try {
      const userOK = await this.authUser(userId, secret);
      debug('checkAuth user', userOK);
      if (!userOK || !userOK.session) {
        response.status(403).send('Unauthorized');
        return false;
      }
      response.header('x-access-token', userOK.session);
      return true;
    } catch (e) {
      errors('checkAuth user', e.message);
      response.status(403).send('Unauthorized');
      return false;
    }
  }

  close() {
    if (this.timekeeper) {
      this.timekeeper.close();
      this.timekeeper = undefined;
    }
    if (this.auth) {
      this.auth.close();
      this.auth = undefined;
    }
  }

  async setAuth(authOpts) {
    const authMethod = authOpts && authOpts.method;
    let Auth;
    debug('setAuth', authMethod);

    switch (authMethod) {
      case 'cognito-auth':
        // eslint-disable-next-line global-require
        // Auth = require('cognito-auth');
        // XXX TODO replace stub
        Auth = {
          CognitoAuth: class {
            // eslint-disable-next-line class-methods-use-this
            close() { }
          },
        };
        this.auth = new Auth.CognitoAuth(authOpts);
        this.authSession = async (userId, secret) => {
          const credentials = {
            email: userId, // XXX
            password: secret,
          };
          return this.auth.authenticateSession(credentials);
        };
        // eslint-disable-next-line func-names
        this.authUser = async function (userId, secret) {
          const credentials = {
            email: userId, // XXX
            password: secret,
          };
          debug('authenticating user', userId);
          return this.auth.authenticateUser(credentials);
        };
        break;
      case 'simple-auth':
      default:
        // eslint-disable-next-line global-require
        Auth = require('simple-auth');
        this.auth = new Auth.SimpleAuth(authOpts);
        this.authSession = async (userId, secret) => {
          const credentials = {
            userId,
            session: secret,
          };
          debug('authenticating session', credentials);
          return this.auth.authenticateSession(credentials);
        };
        // eslint-disable-next-line func-names
        this.authUser = async function (userId, secret) {
          const credentials = {
            id: userId,
            password: secret,
          };
          debug('authenticating user', userId);
          return this.auth.authenticateUser(credentials);
        };
        await this.auth.setup();
        break;
    }
  }

  async setup() {
    await this.timekeeper.setup();
    this.setupAlive();
    this.setupDatetimeGet();
    this.setupEventGet();
    this.setupEventSummary();
    this.setupKeyRetrieval();
    this.setupNevers();
    this.setupPasswordChange();
    this.setupRsvp();
    this.setupUpdateSection();
    this.setupUserGet();
    this.setupVenueGet();
    return this;
  }

  /** Liveness check. */
  setupAlive() {
    this.router.get(
      '/alive',
      async (req, res) => res.status(200).send('OK'),
    );
  }

  setupDatetimeGet() {
    this.router.get(
      '/datetime/get/:userId/:dateTimeId',
      async (req, res) => {
        try {
          const userId = parseInt(req.params.userId, 10);
          const dateTimeId = parseInt(req.params.dateTimeId, 10);
          debug('datetime get', userId);
          if (await this.checkAuth(req, res, userId)) {
            const result = await this.timekeeper.getDatetime(dateTimeId);
            res.status(200).send(JSON.stringify(result));
          }
          return undefined;
        } catch (err) {
          errors('datetime get', err);
          return res.status(500).send('get datetime failure');
        }
      },
    );
  }

  setupEventGet() {
    // handle search after possibly inserting missing query from route.
    // Do we unify route with odd regexp? SO indicates confusion among users and
    // express versions.
    const searchEvents = async (res, id, query) => {
      try {
        const result = await this.timekeeper.getEvents(query);
        return res.status(200).send(JSON.stringify(result));
      } catch (err) {
        errors('searchEvent', err);
        return res.status(500).send('search failure');
      }
    };

    this.router.get(
      '/event/list/:userId',
      async (req, res) => {
        const userId = parseInt(req.params.userId, 10);
        debug('events list', userId);
        if (await this.checkAuth(req, res, userId)) {
          return searchEvents(res, userId, {});
        }
        return undefined;
      },
    );

    this.router.get(
      '/event/list/:userId/:query',
      async (req, res) => {
        const { query } = req.params;
        const userId = parseInt(req.params.userId, 10);
        const queryObj = JSON.parse(query);
        debug('events query', userId, query);
        if (await this.checkAuth(req, res, userId)) {
          return searchEvents(res, userId, queryObj);
        }
        return undefined;
      },
    );

    this.router.get(
      '/event/get/:userId/:eventId',
      async (req, res) => {
        try {
          const eventId = parseInt(req.params.eventId, 10);
          const userId = parseInt(req.params.userId, 10);
          debug('events get', userId, eventId);
          if (await this.checkAuth(req, res, userId)) {
            const result = await this.timekeeper.getEvent(eventId, userId);
            debug('events got', result);
            if (result) {
              return res.status(200).send(JSON.stringify(result));
            }
            return res.status(404).send();
          }
          return undefined;
        } catch (err) {
          errors('getEvent', err);
          return res.status(500).send('event lookup failure');
        }
      },
    );
  }

  setupEventSummary() {
    this.router.get(
      '/event/summary/:userId/:eventId',
      async (req, res) => {
        try {
          const userId = parseInt(req.params.userId, 10);
          const eventId = parseInt(req.params.eventId, 10);
          if (await this.checkAuth(req, res, userId)) {
            const rsvps = await this.timekeeper.summarizeRsvps(eventId, userId);
            return res.status(200).send(JSON.stringify(rsvps));
          }
          return undefined;
        } catch (error) {
          errors('eventSummary', error);
          return res.status(500).send('summarize failure');
        }
      },
    );

    this.router.get(
      '/event/detail/:userId/:eventId',
      async (req, res) => {
        const userId = parseInt(req.params.userId, 10);
        const eventId = parseInt(req.params.eventId, 10);
        if (await this.checkAuth(req, res, userId)) {
          const rsvps = await this.timekeeper.collectRsvps(eventId, userId);
          return res.status(200).send(JSON.stringify(rsvps));
        }
        return undefined;
      },
    );
  }

  setupKeyRetrieval() {
    this.router.get(
      '/key/:userId/:key',
      async (req, res) => {
        const { key } = req.params;
        const userId = parseInt(req.params.userId, 10);
        if (await this.checkAuth(req, res, userId)) {
          const value = await this.timekeeper.getValue(userId, key);
          if (value !== undefined) {
            return res.status(200).send(value);
          }
        }
        return undefined;
      },
    );
  }

  setupNevers() {
    this.router.get(
      '/event/never/:userId/:dateStr',
      async (req, res) => {
        const { dateStr } = req.params;
        const userId = parseInt(req.params.userId, 10);
        debug('never', userId, dateStr);
        if (await this.checkAuth(req, res, userId)) {
          await this.timekeeper.never(userId, dateStr);
          return res.status(200).send('OK');
        }
        return undefined;
      },
    );

    this.router.get(
      '/event/nevers/:userId',
      async (req, res) => {
        const userId = parseInt(req.params.userId, 10);
        if (await this.checkAuth(req, res, userId)) {
          const todayStr = dt.datepickerFormat({}, new Date());
          debug('nevers', userId, todayStr);
          const nevers = await this.timekeeper.getNevers(userId, todayStr);
          return res.status(200).send(JSON.stringify(nevers));
        }
        return undefined;
      },
    );
  }

  setupPasswordChange() {
    this.router.get(
      '/password/change/:userId/:newPassword',
      async (req, res) => {
        const { newPassword } = req.params;
        const userId = parseInt(req.params.userId, 10);
        if (await this.checkAuth(req, res, userId)) {
          // XXX API/reset params
          await this.auth.setPassword(userId, newPassword);
          return res.status(200).send('OK');
        }
        return undefined;
      },
    );

    // Send an email to the user with a new password
    this.router.get(
      '/password/reset/:userName',
      async (req, res) => {
        const { userName } = req.params;
        const trimmedInput = Server.trim(userName);
        const userInfo = {
          id: undefined,
          name: undefined,
          email: undefined,
        };

        // from email
        if (Server.isEmail(trimmedInput)) {
          userInfo.email = trimmedInput;
          userInfo.id = await this.timekeeper.getUserIdByEmail(trimmedInput);
          if (userInfo.id < 0) {
            errors('no user name for password reset from email', trimmedInput);
            return res.status(200).send('OK');
          }
        } else { // from name
          userInfo.name = trimmedInput;
          userInfo.id = await this.timekeeper.getUserId(trimmedInput);
          if (userInfo.id < 0) {
            errors('no user name for password reset', trimmedInput);
            return res.status(200).send('OK');
          }
          const { email } = await this.timekeeper.getUserInfo(userInfo.id);
          if (!email) {
            errors('no email for password reset', userInfo.id, trimmedInput);
            return res.status(200).send('OK');
          }
          userInfo.email = email;
        }

        try {
          await this.auth.resetPassword(userInfo);
        } catch (e) {
          errors(`reset password ${userName} : ${e.message}`);
        }
        return res.status(200).send('OK');
      },
    );
  }

  setupRsvp() {
    this.router.get(
      '/event/rsvp/:userId/:eventId/:dateTimeId/:rsvp',
      async (req, res) => {
        try {
          const userId = parseInt(req.params.userId, 10);
          const eventId = parseInt(req.params.eventId, 10);
          const dateTimeId = parseInt(req.params.dateTimeId, 10);
          const rsvp = parseInt(req.params.rsvp, 10);
          debug('rsvp', userId, eventId, dateTimeId, rsvp);
          if (await this.checkAuth(req, res, userId)) {
            await this.timekeeper.rsvp(eventId, userId, dateTimeId, rsvp);
            return res.status(200).send('OK');
          }
          return undefined;
        } catch (err) {
          errors('rsvp', err);
          return res.status(500).send('rsvp error');
        }
      },
    );

    this.router.get(
      '/event/rsvp/:userId/:eventId',
      async (req, res) => {
        try {
          const userId = parseInt(req.params.userId, 10);
          const eventId = parseInt(req.params.eventId, 10);
          debug('get-rsvp', userId, eventId);
          if (await this.checkAuth(req, res, userId)) {
            const result = await this.timekeeper.getRsvps(eventId, userId);
            return res.status(200).send(JSON.stringify(result));
          }
          return undefined;
        } catch (err) {
          errors('get-rsvp', err);
          return res.status(500).send('get-rsvp error');
        }
      },
    );
  }

  setupUpdateSection() {
    this.router.get(
      '/user/update-section/:userId/:newSection',
      async (req, res) => {
        const { newSection } = req.params;
        const userId = parseInt(req.params.userId, 10);
        debug('update-section', userId, newSection);
        if (await this.checkAuth(req, res, userId)) {
          const updatedSection = await this.timekeeper.updateUserSection(userId, newSection);
          debug('updatedSection', updatedSection);
          return res.status(200).send(updatedSection);
        }
        return undefined;
      },
    );
  }

  setupUserGet() {
    this.router.get(
      '/user/bootstrap/:userName',
      async (req, res) => {
        const { userName } = req.params;
        debug('bootstrap user id get', userName);
        let userId;
        if (Server.isEmail(userName)) {
          userId = await this.timekeeper.getUserIdByEmail(userName);
        } else {
          userId = await this.timekeeper.getUserId(userName);
        }
        if (userId < 0) {
          res.status(403).send('Unauthorized');
          return false;
        }

        const userCheck = await this.checkAuth(req, res, userId);
        debug('bootstrap check', userCheck);
        if (userCheck) {
          const userInfo = await this.timekeeper.getUserInfo(userId);
          res.status(200).send(
            JSON.stringify(Object.assign(userInfo, userCheck)),
          );
        }
        return undefined;
      },
    );

    this.router.get(
      '/user/get/:userId/:whoId',
      async (req, res) => {
        try {
          const userId = parseInt(req.params.userId, 10);
          const whoId = parseInt(req.params.whoId, 10);
          debug('get user info', userId, whoId);
          if (await this.checkAuth(req, res, userId)) {
            const info = await this.timekeeper.getUserInfo(whoId);
            res.status(200).send(JSON.stringify(info));
          }
          return undefined;
        } catch (e) {
          errors('get user info', e);
          return res.status(500).send('cannot lookup user info');
        }
      },
    );

    this.router.get(
      '/user/id/:userId/:whoName',
      async (req, res) => {
        try {
          const { whoName } = req.params;
          const userId = parseInt(req.params.userId, 10);
          debug('get user id', userId, whoName);
          if (await this.checkAuth(req, res, userId)) {
            const id = await this.timekeeper.getUserId(whoName);
            if (id && id > 0) {
              res.status(200).send(id.toString());
            } else {
              res.status(404).send(`not found: ${whoName}`);
            }
          }
          return undefined;
        } catch (err) {
          errors('userid get', err);
          return res.status(500).send('get userid failure');
        }
      },
    );
  }

  setupVenueGet() {
    // see setupEventGet comment on route unification
    const tk = this.timekeeper;
    const searchVenues = (res, id, query) => tk.getVenues(query).
      then(result => res.status(200).send(JSON.stringify(result))).
      catch((err) => {
        errors('venue search', err);
        return res.status(500).send('search venue failure');
      });

    this.router.get(
      '/venue/get/:userId/:venueId',
      async (req, res) => {
        try {
          const userId = parseInt(req.params.userId, 10);
          const venueId = parseInt(req.params.venueId, 10);
          debug('venue get', userId, venueId);
          if (await this.checkAuth(req, res, userId)) {
            const result = await this.timekeeper.getVenues({ id: venueId });
            if (result && result.length) {
              return res.status(200).send(JSON.stringify(result[0]));
            }
            return res.status(404).send(`venue ${venueId} not found`);
          }
          return undefined;
        } catch (err) {
          errors('venue get', err);
          return res.status(500).send('get venue failure');
        }
      },
    );

    // discourage this call?
    this.router.get(
      '/venue/list/:userId',
      async (req, res) => {
        try {
          const userId = parseInt(req.params.userId, 10);
          debug('venue list', userId);
          if (await this.checkAuth(req, res, userId)) {
            return searchVenues(res, userId, {});
          }
          return undefined;
        } catch (err) {
          errors('venue list', err);
          return res.status(500).send('list venue failure');
        }
      },
    );

    this.router.get(
      '/venue/list/:userId/:query',
      async (req, res) => {
        const { query } = req.params;
        const userId = parseInt(req.params.userId, 10);
        const queryObj = JSON.parse(query);
        debug('venue query', userId, query);
        if (await this.checkAuth(req, res, userId)) {
          return searchVenues(res, userId, queryObj);
        }
        return undefined;
      },
    );
  }

  static isEmail(str) {
    return str.includes('@') && !/\s/g.test(str);
  }

  static trim(str) {
    return str.trim().replace(/\s/g, ' ');
  }
};

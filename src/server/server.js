const debug = require('debug')('server');
const errors = require('debug')('server:error');
const SqliteTimekeeper = require('./sqliteTimekeeper');

module.exports = class Server {
  /**
   * @param opts Configuration options:
   *  - mailer (object x (error, info) => void) function used to mail users
   *      messages.  (see nodemailer documentation.)
   *  - router Express.js router
   *  - siteTitle
   *  - siteURL
   *  - timekeeper
   */
  constructor(opts) {
    this.email = opts.email;
    this.mailer = opts.mailer;
    if (!this.mailer) {
      errors('No mailer configured.');
    }
    this.router = opts.router;
    this.siteTitle = opts.siteTitle;
    this.siteURL = opts.siteURL;
    this.timekeeper = opts.timekeeper ||
      new SqliteTimekeeper(opts.sqliteTimekeeper || {});
  }

  async checkSecret(request, response, userId) {
    const badUserPassword = () => {
      response.status(401).send('bad user id or password');
      return false;
    };

    const secret = decodeURIComponent(request.headers['x-access-token']);
    if (!secret) {
      return badUserPassword();
    }
    const checked = await this.timekeeper.checkSecret(userId, secret);
    if (!checked) {
      return badUserPassword();
    }
    return checked;
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
      '/datetime/get/:userId/:dateTimeId',
      async (req, res) => {
        try {
          const userId = parseInt(req.params.userId, 10);
          const dateTimeId = parseInt(req.params.dateTimeId, 10);
          debug('datetime get', userId);
          if (await this.checkSecret(req, res, userId)) {
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
        if (await this.checkSecret(req, res, userId)) {
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
        if (await this.checkSecret(req, res, userId)) {
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
          if (await this.checkSecret(req, res, userId)) {
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
          if (await this.checkSecret(req, res, userId)) {
            const rsvps = await this.timekeeper.collectRsvps(eventId, userId, { summarize: true });
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
        if (await this.checkSecret(req, res, userId)) {
          const rsvps = await this.timekeeper.collectRsvps(eventId, userId);
          return res.status(200).send(JSON.stringify(rsvps));
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
        if (await this.checkSecret(req, res, userId)) {
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
        if (await this.checkSecret(req, res, userId)) {
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
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
        if (await this.checkSecret(req, res, userId)) {
          await this.timekeeper.changePassword(userId, newPassword);
          return res.status(200).send('OK');
        }
        return undefined;
      },
    );

    // Send an email to the user with a new password,
    // while keeping the old available in case of mistake.
    this.router.get(
      '/password/reset/:userName',
      async (req, res) => {
        const { userName } = req.params;
        const { newPassword, email } = await this.timekeeper.resetPassword(userName);

        if (!newPassword) {
          errors('resetPassword invalid user name', userName);
        } else if (!email) {
          errors('resetPassword', `No email for ${userName}. Temp password: ${newPassword}`);
        } else if (this.mailer) {
          const msg = `Someone at ${this.siteTitle} has requested your ` +
            'password to be reset.  If you requested the password reset, ' +
            `visit ${this.siteURL} with user name '${userName}' and temporary ` +
            `password ${newPassword} .  Your old password is still valid, ` +
            'the temporary password will be invalidated the next time you ' +
            'log in, and you may ignore this email if you did not request ' +
            'your password reset.';
          debug('resetPassword', this.email, email, msg);
          const mailOptions = {
            from: this.email,
            to: email,
            subject: `${this.siteTitle} Password Reset`,
            text: msg,
            html: `<p>${msg}</p>`,
          };
          this.mailer(mailOptions, (error, info) => {
            if (error) {
              errors('sendMail', error);
            } else {
              debug('sendMail', info.messageId);
            }
          });
        } else {
          errors('resetPassword', `No mailer configured.  Temp password for ${userName}: ${newPassword}`);
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
          if (await this.checkSecret(req, res, userId)) {
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
          if (await this.checkSecret(req, res, userId)) {
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
        if (await this.checkSecret(req, res, userId)) {
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
        const userId = await this.timekeeper.getUserId(userName);
        if (await this.checkSecret(req, res, userId)) {
          const userInfo = await this.timekeeper.getUserInfo(userId);
          res.status(200).send(JSON.stringify(userInfo));
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
          if (await this.checkSecret(req, res, userId)) {
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
          if (await this.checkSecret(req, res, userId)) {
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
          if (await this.checkSecret(req, res, userId)) {
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
          if (await this.checkSecret(req, res, userId)) {
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
        if (await this.checkSecret(req, res, userId)) {
          return searchVenues(res, userId, queryObj);
        }
        return undefined;
      },
    );
  }
};

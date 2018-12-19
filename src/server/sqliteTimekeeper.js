const bcrypt = require('bcrypt');
const crypto = require('crypto');
const debug = require('debug')('sqliteTimekeeper');
const errors = require('debug')('sqliteTimekeeper:error');

const dbs = require('./dbs');
const Query = require('./query');
const AbstractTimekeeper = require('./timekeeper');

const q = AbstractTimekeeper.escapeQuotes;
const saltRounds = 10;

module.exports = class SqliteTimekeeper extends AbstractTimekeeper {
  /**
   * @param opts [object]
   *  - file, defaults to ':memory:'
   */
  constructor(opts) {
    super();

    const fileOrMemory = (opts && opts.file) || ':memory:';

    this.db = new dbs.SQLite(
      fileOrMemory,
      dbs.sqlite3.OPEN_CREATE | dbs.sqlite3.OPEN_READWRITE, // eslint-disable-line
      (err) => {
        if (err) {
          errors(err.message);
        } else {
          debug('Connected to the SQlite database:', fileOrMemory);
        }
      },
    );
  }

  /**
   * Update a password for a user.
   */
  async changePassword(userId, newPassword) {
    const hashed = await bcrypt.hash(newPassword, saltRounds);
    const query = `UPDATE participants SET secret='${hashed}', recovery=NULL ` +
      `WHERE rowid = ${userId}`;
    debug('changePassword', userId);
    return this.db.runAsync(query);
  }

  /**
   * @return promise to validity of password matching stored secret,
   * invalidating recovery password, or password matching recovery.
   */
  async checkSecret(userId, password) {
    AbstractTimekeeper.requireInt(userId, 'checkSecret(userId)');
    let query = `SELECT secret, recovery FROM participants WHERE rowid = ${userId}`;
    debug('checkSecret', query);
    const [result] = await this.db.allAsync(query);
    if (!result) {
      debug('checkSecret invalid user id', userId);
      return false;
    }

    let checked = await bcrypt.compare(password, result.secret);
    if (checked) {
      if (result.recovery) {
        query = `UPDATE participants SET recovery=NULL WHERE rowid=${userId}`;
        debug('password matches, reset recovery', query);
        await this.db.runAsync(query);
      }
      debug('checkSecret OK', userId);
      return true;
    }

    if (result.recovery && result.recovery.length) {
      checked = await bcrypt.compare(password, result.recovery);
      if (checked) {
        query = `UPDATE participants SET secret='${result.recovery}', recovery=NULL WHERE rowid=${userId}`;
        debug('recover password used, reset recovery', 'UPDATE participants SET secret=...');
        await this.db.runAsync(query);
      }
      debug('checkSecret tried recover', userId, checked);
      return checked;
    }
    debug('checkSecret failed', userId);
    return false;
  }

  async close() {
    this.db.close();
    this.db = undefined;
    return this;
  }

  /**
   * @return promise to this.
   */
  async closeEvent(eventId, dateTimeId) {
    AbstractTimekeeper.requireInt(eventId, 'closeEvent(eventId)');

    let query;
    if (dateTimeId) {
      AbstractTimekeeper.requireInt(dateTimeId, 'closeEvent(dateTimeId)');
      query = `UPDATE events SET dateTime = ${dateTimeId} ` +
        `WHERE rowid = ${eventId}`;
    } else {
      query = 'UPDATE events SET dateTime = -1 ' +
        `WHERE rowid = ${eventId}`;
    }
    debug('closeEvent', query);
    return this.db.runAsync(query).
      then(() => this);
  }

  /**
   * @return array of datetime, count, participant-id lists
   */
  async collectRsvps(eventId, userId) {
    AbstractTimekeeper.requireInt(eventId, 'collectRsvps(eventId)');
    AbstractTimekeeper.requireInt(userId, 'collectRsvps(userId)');
    const { db } = this;

    async function summarize() {
      const query = 'SELECT dateTime, attend, COUNT(rowid) AS count FROM rsvps ' +
        `WHERE event=${eventId} GROUP BY dateTime, attend`;
      debug('summarize rsvps', query);
      return db.allAsync(query).
        then((response) => {
          const result = {};
          for (let i = 0; i < response.length; i++) {
            const row = response[i];
            const dtId = row.dateTime.toString();
            if (!result[dtId]) {
              result[dtId] = {};
            }
            result[dtId][row.attend.toString()] = row.count;
          }
          return result;
        });
    }

    async function detail() {
      const query = 'SELECT dateTime, attend, participant FROM rsvps ' +
        `WHERE event=${eventId}`;
      debug('detail rsvps', query);
      const response = await db.allAsync(query);
      debug('detail raw', response);
      const result = {};
      for (let i = 0; i < response.length; i++) {
        const row = response[i];
        const dtId = row.dateTime.toString();
        if (!result[dtId]) {
          result[dtId] = {};
        }
        result[dtId][row.participant.toString()] = row.attend;
      }
      debug('detail result', result);
      return result;
    }

    if (!userId) {
      return summarize();
    }
    const isAdminQuery = `SELECT organizer FROM participants WHERE rowid=${userId}`;
    debug('isAdmin', isAdminQuery);
    const isAdmin = await this.db.allAsync(isAdminQuery);
    debug('isAdmin', isAdmin);
    if (isAdmin && isAdmin[0].organizer) {
      return detail();
    }
    return summarize();
  }

  /**
   * @return promise to unique event id.
   */
  async createDateTime(eventId, yyyymmdd, hhmm, duration) {
    AbstractTimekeeper.requireInt(eventId, 'createDateTime(eventId)');
    SqliteTimekeeper.validateYyyyMmDd(yyyymmdd);
    SqliteTimekeeper.validateHhMm(hhmm);
    SqliteTimekeeper.validateDuration(duration);
    const ts = new Date().getTime();
    const query = 'INSERT INTO dateTimes(event, yyyymmdd, hhmm, duration) VALUES ' +
      `(${eventId}, '${yyyymmdd}', '${hhmm}', '${duration}')`;
    let dtId;
    debug('createDateTime', query);
    return this.db.runAsync(query).
      then(() => this.lastId()).
      then((lastId) => {
        dtId = lastId;
        const rsvpNever = 'INSERT INTO rsvps(event, participant, dateTime, attend, timestamp) ' +
          `SELECT ${eventId}, nevers.participant, ${dtId}, -1, ${ts} ` +
          `FROM nevers WHERE yyyymmdd='${yyyymmdd}'`;
        debug('createDateTime never', rsvpNever);
        return this.db.runAsync(rsvpNever);
      }).then(() => dtId);
  }

  /**
   * @return promise to unique event id.
   */
  async createEvent(name, venue, description) {
    AbstractTimekeeper.requireInt(venue, 'createEvent(venue)');
    const query = 'INSERT INTO events(name, venue, description) VALUES ' +
      `('${q(name)}', ${venue}, '${description ? q(description) : ''}')`;
    debug('createEvent', query);
    return this.db.runAsync(query).
      then(() => this.lastId());
  }

  /**
   * @return promise to unique participant id.
   */
  async createParticipant(name, password, opts) {
    return bcrypt.hash(password, saltRounds).
      then((hash) => {
        const query = 'INSERT INTO participants(name, secret, organizer, section, email) VALUES ' +
          `('${q(name)}', '${hash}', ${opts && opts.organizer ? 1 : 0}, ` +
          `'${(opts && opts.section) || ''}', '${(opts && opts.email) || ''}')`;
        debug('createParticipant', name, opts);
        debug('createParticipant', query);
        return this.db.runAsync(query);
      }).then(() => this.lastId());
  }

  /**
   * @return promise to unique venue id.
   */
  async createVenue(name, address) {
    const query = 'INSERT INTO venues(name, address) VALUES ' +
      `('${q(name)}', '${q(address)}')`;
    debug('createVenue', query);
    return this.db.runAsync(query).
      then(() => this.lastId()).
      catch((e) => {
        if (e.message === 'SQLITE_CONSTRAINT: UNIQUE constraint failed: venues.name') {
          const nameQuery = `SELECT rowid FROM venues WHERE name='${q(name)}'`;
          debug('duplicate createVenue', nameQuery);
          return this.db.allAsync(nameQuery).
            then(result => result[0].rowid);
        }
        throw e;
      });
  }

  /**
   * @return a promise to datetime info.
   */
  async getDatetime(dateTimeId) {
    AbstractTimekeeper.requireInt(dateTimeId, 'getDatetime(dateTimeId)');
    const query = `SELECT rowid AS id, * FROM dateTimes where id=${dateTimeId}`;
    debug('getDatetime', query);
    return this.db.allAsync(query).
      then((result) => {
        if (result.length) {
          return result[0];
        } return undefined;
      });
  }

  /**
   * @return promise of event object description.
   * @param eventId
   * @param userIdOpt if specified, join the relevant rsvps to the
   *   associated datetimes.
   */
  async getEvent(eventId, userIdOpt) {
    const eventQuery = `SELECT rowid AS id, * FROM events WHERE id=${eventId}`;
    debug('getEvent', eventQuery);
    return this.db.allAsync(eventQuery).
      then((results) => {
        if (!results) {
          return undefined;
        }
        return results[0];
      }).
      then((eventObj) => {
        if (!eventObj) {
          return eventObj;
        }

        // Put the datetimes on the event.
        const dtQuery = userIdOpt ?
          'SELECT dt.rowid AS id, dt.*, r.attend ' +
            'FROM dateTimes dt ' +
            `LEFT JOIN (SELECT * FROM rsvps WHERE participant=${userIdOpt}) r ` +
            'ON dt.rowid = r.dateTime ' +
            `WHERE dt.event=${eventId} ` :
          `SELECT rowid AS id, * FROM dateTimes WHERE event=${eventId}`;

        debug('getEvent dt', userIdOpt, dtQuery);
        return this.db.allAsync(dtQuery).
          then((dtResults) => {
            eventObj.dateTimes = dtResults || []; // eslint-disable-line
            if (eventObj.dateTime) {
              // eslint-disable-next-line
              eventObj.dateTime = eventObj.dateTimes.
                find(dt => dt.id === eventObj.dateTime);
            }
            return eventObj;
          });
      });
  }


  /**
   * @param opts venue-query
   * @return promise an array of event ids.
   */
  async getEvents(opts) {
    const query = `SELECT rowid AS id FROM events ${
      Query.simpleWhere(opts)}`;
    debug('getEvents', query);
    return this.db.allAsync(query).
      then(result => result.map(x => x.id));
  }

  async getNevers(participantId, sinceOpt) {
    let since;
    if (sinceOpt) {
      SqliteTimekeeper.validateYyyyMmDd(sinceOpt);
      since = ` AND yyyymmdd > '${sinceOpt}'`;
    } else {
      since = '';
    }

    const query = 'SELECT * FROM nevers ' +
      `WHERE participant=${participantId}${since}`;
    debug('getNevers', query);
    return this.db.allAsync(query).
      then(result => result.map(row => row.yyyymmdd));
  }

  /**
   * @return a promise to a map of datetimes to responses.
   */
  async getRsvps(eventId, userId) {
    AbstractTimekeeper.requireInt(eventId, 'getRsvps(eventId)');
    AbstractTimekeeper.requireInt(userId, 'getRsvps(userId)');
    const query = 'SELECT datetime, attend FROM rsvps ' +
      `WHERE event=${eventId} AND participant=${userId}`;
    debug('getRsvps', eventId, userId);
    return this.db.allAsync(query).
      then(result => result.reduce(
        (accum, x) => {
          accum[x.dateTime] = x.attend; // eslint-disable-line
          return accum;
        },
        {},
      ));
  }

  /**
   * @return promise to id.
   */
  async getUserId(userName) {
    const query = `SELECT rowid FROM participants WHERE name = '${q(userName)}'`;
    debug('getUserId', query);
    return this.db.allAsync(query).
      then((result) => {
        if (!result.length) {
          return -1;
        }
        return result[0].rowid;
      });
  }

  /**
   * @return promise to info.
   */
  async getUserInfo(userId) {
    AbstractTimekeeper.requireInt(userId, 'getUserInfo(userId)');
    const query = `SELECT rowid as id, * FROM participants WHERE id = ${userId}`;
    debug('getUserInfo', query);
    return this.db.allAsync(query).
      then((result) => {
        if (!result.length) {
          return undefined;
        }
        const info = result[0];
        delete info.secret;
        delete info.recovery;
        return info;
      });
  }

  /**
   * @param opts
   *  venue-query
   * @return promise an array of venue objects.
   */
  async getVenues(opts) {
    const query = `SELECT rowid AS id, * FROM venues ${
      Query.simpleWhere(opts)}`;
    debug('getVenues', query);
    return this.db.allAsync(query);
  }

  /**
   * @return the id of the most-recently inserted row.
   */
  async lastId() {
    return this.db.allAsync('SELECT last_insert_rowid()').
      then((x) => {
        debug('last', x);
        return x[0]['last_insert_rowid()'];
      });
  }

  async never(participantId, dateStr) {
    AbstractTimekeeper.requireInt(participantId, 'never(participantId)');
    SqliteTimekeeper.validateYyyyMmDd(dateStr);
    const ts = new Date().getTime();
    const neverQuery = 'INSERT OR REPLACE INTO nevers(' +
      'participant, yyyymmdd) VALUES' +
      `(${participantId}, '${dateStr}')`;

    // XXX HOW TO COMBINE result into INSERT?
    // XXX AVOID SQL errors when no event exists (we ignore catch to hack)
    const coincidentDateTimes = 'SELECT rowid FROM dateTimes dt ' +
      `WHERE dt.yyyymmdd='${dateStr}' ORDER BY rowid`;
    const coincidentEvents = 'SELECT event FROM dateTimes dt ' +
      `WHERE dt.yyyymmdd='${dateStr}' ORDER BY rowid`;
    const updateDTQuery = 'INSERT OR REPLACE INTO rsvps(' +
      'event, dateTime, participant, attend, timestamp) VALUES ' +
      `((${coincidentEvents}), (${coincidentDateTimes}), ${participantId}, -1, ${ts})`;
    debug('never', neverQuery);
    await this.db.runAsync(neverQuery).
      catch(e => errors('never', e.message));
    debug('never update', updateDTQuery);
    return this.db.runAsync(updateDTQuery).
      catch(e => errors('never update', e.message));
  }

  /**
   * Generate and place a temporary password in the participant table.
   */
  async resetPassword(userName) {
    let query = `SELECT email FROM participants WHERE name='${userName}'`;
    debug('resetPassword', query);
    const emailResult = await this.db.allAsync(query);
    if (!emailResult || !emailResult.length) {
      debug('resetPassword: invalid name', userName);
      return {
        email: undefined,
        newPassword: undefined,
      };
    }

    // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
    const newPassword = crypto.randomBytes(20).toString('hex');
    const newSecret = await bcrypt.hash(newPassword, saltRounds);
    query = `UPDATE participants SET recovery='${newSecret}' ` +
      `WHERE name='${userName}'`;
    await this.db.runAsync(query);
    const { email } = emailResult[0];
    debug('reseting password', userName, email);
    return {
      newPassword,
      email: (email || undefined), // handle empty email string
    };
  }

  /**
   * @return promise to unique response id.
   */
  async rsvp(eventId, participantId, dateTimeId, attend) {
    AbstractTimekeeper.requireInt(eventId, 'rsvp(eventId)');
    AbstractTimekeeper.requireInt(participantId, 'rsvp(participantId)');
    const innerJoinId = '(SELECT rowid FROM rsvps WHERE ' +
      `event=${eventId} AND participant=${participantId} ` +
      `AND dateTime=${dateTimeId})`;
    const ts = new Date().getTime();
    const query = 'INSERT OR REPLACE INTO rsvps(' +
      'rowid, event, participant, dateTime, attend, timestamp) VALUES' +
      `(${innerJoinId}, ${eventId}, ${participantId}, ${dateTimeId}, ${attend}, ${ts})`;
    debug('rsvp', query);
    return this.db.runAsync(query).
      then(() => this.lastId());
  }

  async setup() {
    return [
      'CREATE TABLE IF NOT EXISTS events (name TEXT UNIQUE, ' +
        'description TEXT NOT NULL, venue INT NOT NULL, dateTime INT)',
      'CREATE INDEX IF NOT EXISTS idx_event_name ON events(name)',
      'CREATE INDEX IF NOT EXISTS idx_event_venue ON events(venue)',
      'CREATE TABLE IF NOT EXISTS participants (name TEXT NOT NULL, secret TEXT, ' +
        'section TEXT, organizer INT DEFAULT 0, email TEXT, recovery TEXT)',
      'CREATE INDEX IF NOT EXISTS idx_participants_name ON participants(name)',
      'CREATE TABLE IF NOT EXISTS sections (name TEXT NOT NULL UNIQUE)',
      'CREATE TABLE IF NOT EXISTS dateTimes (event INT, yyyymmdd TEXT, ' +
        'hhmm TEXT, duration TEXT)',
      'CREATE INDEX IF NOT EXISTS idx_dateTimes_event ON dateTimes(event)',
      'CREATE TABLE IF NOT EXISTS nevers (participant INT, yyyymmdd TEXT, ' +
        'UNIQUE(participant, yyyymmdd))',
      'CREATE INDEX IF NOT EXISTS idx_nevers_date ON nevers(yyyymmdd)',
      'CREATE TABLE IF NOT EXISTS venues (name TEXT UNIQUE, address TEXT)',
      'CREATE INDEX IF NOT EXISTS idx_venues_name ON venues(name)',
      'CREATE TABLE IF NOT EXISTS rsvps (event INT NOT NULL, ' +
        'participant INT NOT NULL, dateTime INT NOT NULL, attend INT DEFAULT 0, ' +
        'timestamp INT NOT NULL)',
      'CREATE INDEX IF NOT EXISTS idx_rsvps_event ON rsvps(event)',
      'CREATE INDEX IF NOT EXISTS idx_rsvps_participant ON rsvps(participant)',
    ].reduce(
      (accum, query) => {
        debug('setup', query);
        return accum.then(() => this.db.runAsync(query));
      },
      Promise.resolve(true),
    ).then(() => this);
  }

  async updateUserSection(userId, newSection) {
    const lcSection = newSection.toLowerCase();
    const getSectionsQuery = 'SELECT name FROM sections';
    debug('updateUserSection', getSectionsQuery);
    const sections = await this.db.allAsync(getSectionsQuery);
    if (sections && sections.find(x => x.name === lcSection)) {
      const updateQuery = `UPDATE participants SET section='${lcSection}' WHERE rowid=${userId}`;
      debug('updateUserSection', updateQuery);
      await this.db.runAsync(updateQuery);
      return lcSection;
    }
    const info = await this.getUserInfo(userId);
    return info.section || '';
  }

  static validateYyyyMmDd(yyyymmdd) {
    if (!yyyymmdd || !yyyymmdd.match(/^[0-9]{4}[/-][0-9]{1,2}[/-][0-9]{1,2}$/)) {
      throw new Error(`yyyymmdd validation: ${yyyymmdd}`);
    }
  }

  static validateHhMm(hhmm) {
    if (!hhmm || !hhmm.match(/^[0-9]{1,2}:[0-9]{2}$/)) {
      throw new Error(`hhmm validation: ${hhmm}`);
    }
  }

  static validateDuration(duration) {
    if (!duration || !duration.match(/^[0-9]+m$/)) {
      throw new Error(`duration validation: ${duration}`);
    }
  }
};

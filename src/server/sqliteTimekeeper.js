const bcrypt = require('bcrypt');
const debug = require('debug')('sqliteTimekeeper');
const errors = require('debug')('sqliteTimekeeper:error');
const sqlite3 = require('sqlite3-promise').verbose();

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

    this.db = new sqlite3.Database(
      fileOrMemory,
      sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE, // eslint-disable-line
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
   * @return promise to validity.
   */
  async checkSecret(userId, password) {
    AbstractTimekeeper.requireInt(userId, 'checkSecret(userId)');
    const query = `SELECT secret FROM participants WHERE rowid = ${userId}`;
    debug('checkSecret', query);
    return this.db.allAsync(query).
      then((result) => {
        if (!result.length) {
          return false;
        }
        return bcrypt.compare(password, result[0].secret);
      });
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
          for (let i = 0; i < response.length; i += 1) {
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
      return db.allAsync(query).
        then((response) => {
          const result = {};
          for (let i = 0; i < response.length; i += 1) {
            const row = response[i];
            const dtId = row.dateTime.toString();
            if (!result[dtId]) {
              result[dtId] = {};
            }
            result[dtId][row.participant.toString()] = row.attend;
          }
          return result;
        });
    }

    if (!userId) {
      return summarize();
    }
    const isAdminQuery = `SELECT organizer FROM participants WHERE rowid=${userId}`;
    debug('isAdmin', isAdminQuery);
    return this.db.allAsync(isAdminQuery).
      then(result => ((result && result[0].organizer) ? detail() : summarize()));
  }

  /**
   * @return promise to unique event id.
   */
  async createDateTime(eventId, yyyymmdd, hhmm, duration) {
    AbstractTimekeeper.requireInt(eventId, 'createDateTime(eventId)');
    SqliteTimekeeper.validateYyyyMmDd(yyyymmdd);
    SqliteTimekeeper.validateHhMm(hhmm);
    SqliteTimekeeper.validateDuration(duration);
    const query = 'INSERT INTO dateTimes(event, yyyymmdd, hhmm, duration) VALUES ' +
      `(${eventId}, '${yyyymmdd}', '${hhmm}', '${duration}')`;
    debug('createDateTime', query);
    return this.db.runAsync(query).
      then(() => this.lastId());
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
        const query = 'INSERT INTO participants(name, secret, organizer, section) VALUES ' +
          `('${q(name)}', '${hash}', ${opts && opts.organizer ? 1 : 0}, '${(opts && opts.section) || ''}')`;
        debug('createParticipant', name, opts);
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
   * @param opts
   *  venue-query
   *  active - defaults to true
   * @return promise an array of events.
   */
  async getEvents(opts) {
    const query = 'SELECT rowid FROM events'; // XXX query
    debug('getEvents', opts);
    debug('getEvents', query);
    return this.db.allAsync(query).
      then(result => result.map(x => x.rowid));
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
        return info;
      });
  }

  /**
   * @param opts
   *  venue-query
   * @return promise an array of venue objects.
   */
  async getVenues(opts) {
    const query = 'SELECT rowid as id, * FROM venues';
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

  /**
   * @return promise to unique response id.
   */
  async rsvp(eventId, participantId, dateTimeId, attend) {
    AbstractTimekeeper.requireInt(eventId, 'rsvp(eventId)');
    AbstractTimekeeper.requireInt(participantId, 'rsvp(participantId)');
    const query = 'INSERT INTO rsvps(event, participant, dateTime, attend, timestamp) VALUES ' +
      `(${eventId}, ${participantId}, ${dateTimeId}, ${attend}, ${new Date().getTime()})`;
    debug('rsvp', query);
    return this.db.runAsync(query).
      then(() => this.lastId());
  }

  async setup() {
    return [
      'CREATE TABLE IF NOT EXISTS events (name TEXT UNIQUE, description TEXT NOT NULL, venue INT NOT NULL, dateTime INT)',
      'CREATE INDEX IF NOT EXISTS idx_event_name ON events(name)',
      'CREATE INDEX IF NOT EXISTS idx_event_venue ON events(venue)',
      'CREATE TABLE IF NOT EXISTS participants (name TEXT NOT NULL, secret TEXT, section TEXT, organizer INT DEFAULT 0)',
      'CREATE INDEX IF NOT EXISTS idx_participants_name ON participants(name)',
      'CREATE TABLE IF NOT EXISTS dateTimes (event INT, yyyymmdd TEXT, hhmm TEXT, duration TEXT)',
      'CREATE INDEX IF NOT EXISTS idx_dateTimes_event ON dateTimes(event)',
      'CREATE TABLE IF NOT EXISTS venues (name TEXT UNIQUE, address TEXT)',
      'CREATE INDEX IF NOT EXISTS idx_venues_name ON venues(name)',
      'CREATE TABLE IF NOT EXISTS rsvps (event INT NOT NULL, participant INT NOT NULL, dateTime INT NOT NULL, attend INT DEFAULT 0, timestamp INT NOT NULL)',
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

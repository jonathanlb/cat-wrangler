const debug = require('debug')('sqliteTimekeeper');
const errors = require('debug')('sqliteTimekeeper:error');
const sqlite3 = require('sqlite3-promise').verbose();

const AbstractTimekeeper = require('./timekeeper');

const q = AbstractTimekeeper.escapeQuotes;

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

  async close() {
    this.db.close();
    this.db = undefined;
    return this;
  }

  /**
   * @return promise to this.
   */
  async closeEvent(eventId, dateTimeId) {
    const query = `UPDATE events SET dateTime = ${dateTimeId || -1} `
      + `WHERE rowid = ${eventId}`;
    debug('closeEvent', query);
    return this.db.runAsync(query).
      then(() => this);
  }

  /**
   * @return array of datetime, count, participant-id lists
   */
  async collectRsvps(eventId, userId) {
    throw new Error('collectRsvps not implemented');
  }

  /**
   * @return promise to unique event id.
   */
  async createDateTime(eventId, yyyymmdd, hhmm, duration) {
    SqliteTimekeeper.validateYyyyMmDd(yyyymmdd);
    SqliteTimekeeper.validateHhMm(hhmm);
    SqliteTimekeeper.validateDuration(duration);
    const query = 'INSERT INTO dateTimes(event, yyyymmdd, hhmm, duration) VALUES '
      + `(${eventId}, '${yyyymmdd}', '${hhmm}', '${duration}')`;
    debug('createDateTime', query);
    return this.db.runAsync(query).
      then(() => this.lastId());
  }

  /**
   * @return promise to unique event id.
   */
  async createEvent(name, venue, description) {
    const query = 'INSERT INTO events(name, venue, description) VALUES '
      + `('${q(name)}', ${venue}, '${description ? q(description) : ''}')`;
    debug('createEvent', query);
    return this.db.runAsync(query).
      then(() => this.lastId());
  }

  /**
   * @return promise to unique participant id.
   */
  async createParticipant(name, secret, organizer) {
    const query = 'INSERT INTO participants(name, secret, organizer) VALUES '
      + `('${q(name)}', '${q(secret)}', ${organizer ? 1 : 0})`;
    debug('createParticipant', query);
    return this.db.runAsync(query).
      then(() => this.lastId());
  }

  /**
   * @return promise to unique venue id.
   */
  async createVenue(name, address) {
    const query = 'INSERT INTO venues(name, address) VALUES '
      + `('${q(name)}', '${q(address)}')`;
    debug('createVenue', query);
    return this.db.runAsync(query).
      then(() => this.lastId());
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
    const query = 'INSERT INTO rsvps(event, participant, dateTime, attend, timestamp) VALUES '
      + `(${eventId}, ${participantId}, ${dateTimeId}, ${attend}, ${new Date().getTime()})`;
    debug('rsvp', query);
    return this.db.runAsync(query).
      then(() => this.lastId());
  }

  async setup() {
    return [
      'CREATE TABLE IF NOT EXISTS events (name TEXT UNIQUE, description TEXT NOT NULL, venue INT NOT NULL, dateTime INT)',
      'CREATE INDEX IF NOT EXISTS idx_event_name ON events(name)',
      'CREATE INDEX IF NOT EXISTS idx_event_venue ON events(venue)',
      'CREATE TABLE IF NOT EXISTS participants (name TEXT NOT NULL, secret TEXT, organizer INT DEFAULT 0)',
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
    if (!yyyymmdd.match(/^[0-9]{4}[/-][0-9]{1,2}[/-][0-9]{1,2}$/)) {
      throw new Error(`yyyymmdd validation: ${yyyymmdd}`);
    }
  }

  static validateHhMm(hhmm) {
    if (!hhmm.match(/^[0-9]{1,2}:[0-9]{2}$/)) {
      throw new Error(`hhmm validation: ${hhmm}`);
    }
  }

  static validateDuration(duration) {
    if (!duration.match(/^[0-9]+m$/)) {
      throw new Error(`duration validation: ${duration}`);
    }
  }
};

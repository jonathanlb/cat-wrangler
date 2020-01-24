const debug = require('debug')('sqliteTimekeeper');
const errors = require('debug')('sqliteTimekeeper:error');
const sqlite3 = require('sqlite3-promise');

const Query = require('./query');
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
    debug('Opening', fileOrMemory);

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

    const isAdminQuery = `SELECT organizer FROM participants WHERE rowid=${userId}`;
    debug('isAdmin', isAdminQuery);
    const isAdmin = await this.db.allAsync(isAdminQuery);
    if (!isAdmin || !isAdmin.length || !isAdmin[0].organizer) {
      return {};
    }

    const query = 'SELECT dateTime, attend, participant FROM rsvps ' +
      `WHERE event=${eventId}`;
    debug('detail rsvps', query);
    const response = await this.db.allAsync(query);
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
    debug('createDateTime', query);
    return new Promise((resolve, reject) => {
      this.db.serialize(async () => {
        this.db.run(query);
        const dtId = await this.lastId();
        const rsvpNever = 'INSERT INTO rsvps(event, participant, dateTime, attend, timestamp) ' +
          `SELECT ${eventId}, nevers.participant, ${dtId}, -1, ${ts} ` +
          `FROM nevers WHERE yyyymmdd='${yyyymmdd}'`;
        debug('createDateTime never', rsvpNever);
        await this.db.runAsync(rsvpNever);
        resolve(dtId);
      });
    });
  }

  /**
   * @return promise to unique event id.
   */
  async createEvent(name, venue, description) {
    AbstractTimekeeper.requireInt(venue, 'createEvent(venue)');
    const query = 'INSERT INTO events(name, venue, description) VALUES ' +
      `('${q(name)}', ${venue}, '${description ? q(description) : ''}')`;
    debug('createEvent', query);
    return new Promise((resolve, reject) => {
      this.db.serialize(async () => {
        this.db.run(query);
        resolve(await this.lastId());
      });
    });
  }

  /**
   * @return promise to unique participant id.
   */
  async createParticipant(name, opts) {
    const query = 'INSERT INTO participants(name, organizer, section, email) VALUES ' +
      `('${q(name)}', ${opts && opts.organizer ? 1 : 0}, ` +
      `'${(opts && opts.section) || ''}', '${(opts && opts.email) || ''}')`;
    debug('createParticipant', query);
    return new Promise((resolve, reject) => {
      try {
        this.db.serialize(async () => {
          this.db.run(query);
          resolve(await this.lastId());
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * @return promise to unique venue id.
   */
  async createVenue(name, address) {
    const query = 'INSERT INTO venues(name, address) VALUES ' +
      `('${q(name)}', '${q(address)}')`;
    debug('createVenue', query);
    return new Promise(async (resolve, reject) => {
      try {
        this.db.runAsync(query);
        resolve(await this.lastId());
      } catch (e) {
        if (e.message === 'SQLITE_CONSTRAINT: UNIQUE constraint failed: venues.name') {
          const nameQuery = `SELECT rowid FROM venues WHERE name='${q(name)}'`;
          debug('duplicate createVenue', nameQuery);
          this.db.allAsync(nameQuery).
            then(result => resolve(result[0].rowid));
        }
        reject(e);
      }
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
        return result[0];
      });
  }

  async getValue(userId, key) {
    AbstractTimekeeper.requireInt(userId, 'getValue(userId,key)');
    const query = `SELECT value FROM key_value WHERE key='${q(key)}'`;
    debug('getValue', query);
    const [result] = await this.db.allAsync(query);
    return result && result.value;
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
    const neverQuery = 'INSERT OR IGNORE INTO nevers(' +
      'participant, yyyymmdd) VALUES' +
      `(${participantId}, '${dateStr}')`;

    const coincidentDts =
      `SELECT event, rowid as dateTime, ${participantId} AS participant, -1, ${ts} AS timestamp
        FROM dateTimes
        WHERE yyyymmdd='${dateStr}'`;
    const updateDTQuery =
      `INSERT OR REPLACE INTO rsvps(event, dateTime, participant, attend, timestamp)
        ${coincidentDts}`;

    debug('never', neverQuery);
    await this.db.runAsync(neverQuery);
    debug('never update', updateDTQuery);
    return this.db.runAsync(updateDTQuery);
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
    return new Promise((resolve, reject) => {
      this.db.serialize(async () => {
        this.db.run(query);
        resolve(await this.lastId());
      });
    });
  }

  async setup() {
    return [
      'CREATE TABLE IF NOT EXISTS events (name TEXT UNIQUE, ' +
        'description TEXT NOT NULL, venue INT NOT NULL, dateTime INT)',
      'CREATE INDEX IF NOT EXISTS idx_event_name ON events(name)',
      'CREATE INDEX IF NOT EXISTS idx_event_venue ON events(venue)',
      'CREATE TABLE IF NOT EXISTS participants (name TEXT NOT NULL UNIQUE, ' +
        'section TEXT, organizer INT DEFAULT 0, email TEXT)',
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
        'timestamp INT NOT NULL, UNIQUE(event, participant, dateTime))',
      'CREATE INDEX IF NOT EXISTS idx_rsvps_event ON rsvps(event)',
      'CREATE INDEX IF NOT EXISTS idx_rsvps_participant ON rsvps(participant)',
      'CREATE TABLE IF NOT EXISTS key_value (key TEXT UNIQUE, value TEXT)',
      'CREATE INDEX IF NOT EXISTS idx_key_value ON key_value(key)',
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

  /**
   * Return a map of datetime ids to response to counts.
   * Set the default response to 0 if idOpt is set.
   */
  async summarizeRsvps(eventId, idOpt) {
    AbstractTimekeeper.requireInt(eventId, 'summarizeRsvps(eventId)');
    AbstractTimekeeper.requireInt(idOpt || 0, 'summarizeRsvps(userId)');

    if (idOpt) {
      const ts = new Date().getTime();
      const innerJoin =
        `SELECT rowid AS dateTime, ${eventId} AS event,
          ${idOpt} AS participant, 0 AS attend, ${ts} AS timestamp
          FROM dateTimes WHERE event=${eventId}`;
      const setDefault =
        `INSERT OR IGNORE INTO rsvps
          (dateTime, event, participant, attend, timestamp)
          ${innerJoin}`;
      debug('summarize, set defaults', setDefault);
      await this.db.allAsync(setDefault);
    }

    const query = 'SELECT dateTime, attend, COUNT(rowid) AS count FROM rsvps ' +
      `WHERE event=${eventId} GROUP BY dateTime, attend`;
    debug('summarize rsvps', query);
    const response = await this.db.allAsync(query);
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

/* eslint class-methods-use-this: 0 */
/* eslint no-unused-vars: 0 */

module.exports = class AbstractTimekeeper {
  static escapeQuotes(str) {
    return str.replace(/'/g, '\'\'');
  }

  static requireInt(x, fieldNameDesc) {
    if (typeof x !== 'number') {
      throw new Error(`expecting number for ${fieldNameDesc}, got ${typeof x}`);
    } else if (x % 1 !== 0) {
      throw new Error(`expecting $integer for ${fieldNameDesc}, got ${x}`);
    }
  }

  /**
   * Update a password for a user.
   */
  async changePassword(userId, newPassword) {
    throw new Error('changePassword not implemented');
  }

  /**
   * @return promise on validity.
   */
  async checkSecret(userId, password) {
    throw new Error('checkSecret not implemented');
  }

  /**
   * Optional operation to close up database resources.
   *
   * @return promise to this.
   */
  async close() {
    return this;
  }

  /**
   * @return promise to this.
   */
  async closeEvent(eventId, dateTimeId) {
    throw new Error('closeEvent not implemented');
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
    throw new Error('createDateTime not implemented');
  }

  /**
   * @return promise to unique event id.
   */
  async createEvent(name, venue, description) {
    throw new Error('createEvent not implemented');
  }

  /**
   * @return promise to unique participant id.
   * @param opts optional fields for section or organizer.
   */
  async createParticipant(name, password, opts) {
    throw new Error('createParticipant not implemented');
  }

  /**
   * @return promise to unique venue id.
   */
  async createVenue(name, address) {
    throw new Error('createVenue not implemented');
  }

  /**
   * @return a promise to datetime info.
   */
  async getDatetime(dateTimeId) {
    throw new Error('getDatetime not implemented');
  }

  /**
   * @return promise of event object description.
   */
  async getEvent(eventId) {
    throw new Error('getEvent not implemented');
  }

  /**
   * @param opts
   *  venue-query
   *  active - defaults to true
   * @return promise an array of event ids.
   */
  async getEvents(opts) {
    throw new Error('getEvents not implemented');
  }

  async getNevers(userId) {
    throw new Error('getNevers not implemented');
  }

  /**
   * @return a promise to a map of datetimes to responses.
   */
  async getRsvps(eventId, userId) {
    throw new Error('getRsvps not implemented');
  }

  /**
   * @return promise to id.
   */
  async getUserId(userName) {
    throw new Error('getUserId not implemented');
  }

  /**
   * @return promise to info.
   */
  async getUserInfo(userId) {
    throw new Error('getUserInfo not implemented');
  }

  /**
   * @param opts
   *  venue-query
   * @return promise an array of venue objects.
   */
  async getVenues(opts) {
    throw new Error('getVenues not implemented');
  }

  async never(participantId, dateStr) {
    throw new Error('never not implemented');
  }

  async resetPassword(userName) {
    throw new Error('resetPassword not implemented');
  }

  /**
   * @return promise to unique response id.
   */
  async rsvp(eventId, participantId, dateTimeId, attend) {
    throw new Error('rsvp not implemented');
  }

  /**
   * Optional initialization step.
   *
   * @return promise to this.
   */
  async setup() {
    return this;
  }

  async updateUserSection(userId, newSection) {
    throw new Error('updateUserSection not implemented');
  }
};

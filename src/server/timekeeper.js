/* eslint class-methods-use-this: 0 */
/* eslint no-unused-vars: 0 */

module.exports = class AbstractTimekeeper {
  static escapeQuotes(str) {
    return str.replace(/'/g, '\'\'');
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
   * @return promise on validity.
   */
  async checkSecret(userId, password) {
    throw new Error('checkSecret not implemented');
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
   * @param opts
   *  venue-query
   *  active - defaults to true
   * @return promise an array of events.
   */
  async getEvents(opts) {
    throw new Error('getEvents not implemented');
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
};

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
   */
  async createParticipant(name, secret, organizer) {
    throw new Error('createParticipant not implemented');
  }

  /**
   * @return promise to unique venue id.
   */
  async createVenue(name, address) {
    throw new Error('createVenue not implemented');
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

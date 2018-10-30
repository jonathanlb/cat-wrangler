const SqliteTimekeeper = require('../../src/server/sqliteTimekeeper');

describe('Sqlite Timekeeper Implementations', () => {
  test('Creates tables', () => {
    const tk = new SqliteTimekeeper();
    return tk.setup().
      then(result => expect(result, 'setup() should return timekeeper instance').toBe(tk)).
      then(() => tk.close()).
      then((result) => {
        expect(result, 'close() should return timekeeper instance').toBe(tk);
        expect(result.db, 'close() should free up db').not.toBeDefined();
      });
  });

  test('Creates participants', () => {
    const name = 'Bilbo Baggins';
    const secret = 'It\'s a secret';
    const tk = new SqliteTimekeeper();
    return tk.setup().
      then(() => tk.createParticipant(name, secret)).
      then(id => expect(id).toBe(1)).
      then(() => tk.close());
  });

  test('Creates organizer participants', () => {
    const name = 'Bilbo Baggins';
    const secret = 'It\'s "really" a secret';
    const tk = new SqliteTimekeeper();
    return tk.setup().
      then(() => tk.createParticipant(name, secret, { organizer: true })).
      then(id => expect(id).toBe(1)).
      then(() => tk.close());
  });

  test('Checks passwords for participants', () => {
    const name = 'Bilbo Baggins';
    const secret = 'It\'s a secret';
    const tk = new SqliteTimekeeper();
    let userId;
    return tk.setup().
      then(() => tk.createParticipant(name, secret)).
      then((id) => { userId = id; }).
      then(() => tk.checkSecret(userId, secret)).
      then(result => expect(result).toBe(true)).
      then(() => tk.checkSecret(userId, secret + 1)).
      then(result => expect(result).toBe(false)).
      then(() => tk.close());
  });

  test('Creates venues', () => {
    const name = 'The Shire';
    const address = 'It\'s fictional';
    const tk = new SqliteTimekeeper();
    return tk.setup().
      then(() => tk.createVenue(name, address)).
      then(id => expect(id).toBe(1)).
      then(() => tk.close());
  });

  test('Venue creation is idempotent', () => {
    const name = 'The Shire';
    const address = 'It\'s fictional';
    const tk = new SqliteTimekeeper();
    return tk.setup().
      then(() => tk.createVenue(name, address)).
      then(() => tk.createVenue(name, address)).
      then(id => expect(id).toBe(1)).
      then(() => tk.close());
  });

  test('Creates events', () => {
    const eventName = 'Elevensies';
    const venueName = 'The Shire';
    const address = 'It\'s fictional';
    const tk = new SqliteTimekeeper();
    return tk.setup().
      then(() => tk.createVenue(venueName, address)).
      then(venue => tk.createEvent(eventName, venue)).
      then((id) => {
        expect(id).toBe(1);
        return tk.closeEvent(id);
      }).
      then(() => tk.close());
  });

  test('Creates events with date times', () => {
    const eventName = 'Elevensies';
    const venueName = 'The Shire';
    const address = 'It\'s fictional';
    const times = [['2018-12-01', '10:59', '90m'], ['2018-12-01', '11:02', '87m']];
    const tk = new SqliteTimekeeper();
    return tk.setup().
      then(() => tk.createVenue(venueName, address)).
      then(venue => tk.createEvent(eventName, venue)).
      then(id => Promise.all(
        times.map(tuple => tk.createDateTime(id, tuple[0], tuple[1], tuple[2])),
      )).
      then(() => tk.close());
  });

  test('Can rsvp to events', () => {
    const eventName = 'Elevensies';
    const venueName = 'The Shire';
    const address = 'It\'s fictional';
    const times = [['2018-12-01', '10:59', '90m'], ['2018-12-01', '11:02', '87m']];
    const tk = new SqliteTimekeeper();
    return tk.setup().
      then(() => tk.createVenue(venueName, address)).
      then(venue => tk.createEvent(eventName, venue)).
      then(id => Promise.all(
        times.map(tuple => tk.createDateTime(id, tuple[0], tuple[1], tuple[2])),
      )).
      then(() => tk.rsvp(1, 1, 1, -1)).
      then(() => tk.rsvp(1, 1, 2, 1)).
      then(rsvpId => expect(rsvpId).toBe(2)).
      then(() => tk.close());
  });

  test('Gets datetimes', () => {
    const tk = new SqliteTimekeeper();
    return tk.setup().
      then(() => tk.createDateTime(7, '2018-12-01', '10:00', '5m')).
      then(() => tk.createDateTime(3, '2018-12-01', '10:00', '5m')).
      then(() => tk.getDatetime(1)).
      then(result => expect(result).toEqual(
        {
          id: 1, event: 7, yyyymmdd: '2018-12-01', hhmm: '10:00', duration: '5m',
        },
      )).
      then(() => tk.close());
  });

  test('Gets user ids from names', () => {
    const name = 'Bilbo Baggin\'';
    let userId;
    const tk = new SqliteTimekeeper();
    return tk.setup().
      then(() => tk.createParticipant(name, 'secret')).
      then((id) => { userId = id; }).
      then(() => tk.getUserId(name)).
      then(id => expect(id).toEqual(userId)).
      then(() => tk.getUserId('Arwen')).
      then(id => expect(id).toEqual(-1)).
      then(() => tk.close());
  });

  test('Gets user info from ids', () => {
    const name = 'Bilbo Baggin\'';
    let userId;
    const tk = new SqliteTimekeeper();
    return tk.setup().
      then(() => tk.createParticipant(name, 'secret')).
      then((id) => { userId = id; }).
      then(() => tk.getUserInfo(userId)).
      then(id => expect(id).toEqual({
        id: 1,
        name,
        organizer: 0,
        section: '',
      })).
      then(() => tk.getUserInfo(7)).
      then(id => expect(id).not.toBeDefined()).
      then(() => tk.close());
  });

  test('Collects RSVPs', () => {
    const tk = new SqliteTimekeeper();
    let bilbo; let frodo; let
      eventId;

    const expectedResult = {
      1: { 1: 2 },
      2: { 1: 1, '-1': 1 },
    };

    return tk.setup().
      then(() => tk.createParticipant('Bilbo', 'secret', { organizer: 1 })).
      then((id) => { bilbo = id; }).
      then(() => tk.createParticipant('Frodo', 'secret')).
      then((id) => { frodo = id; }).
      then(() => tk.createVenue('Baggins End', 'The Shire')).
      then(id => tk.createEvent('Elevensies', id, 'Be a hobbit')).
      then((id) => { eventId = id; }).
      then(() => tk.createDateTime(eventId, '2012-01-01', '10:59', '60m')).
      then(() => tk.createDateTime(eventId, '2012-01-01', '10:58', '60m')).
      then(() => tk.rsvp(eventId, bilbo, 1, 1)).
      then(() => tk.rsvp(eventId, bilbo, 2, 1)).
      then(() => tk.rsvp(eventId, frodo, 1, 1)).
      then(() => tk.rsvp(eventId, frodo, 2, -1)).
      then(() => tk.collectRsvps(eventId, 1)).
      then((rsvps) => {
        const expectedAdminResult = {
          1: { [bilbo]: 1, [frodo]: 1 },
          2: { [bilbo]: 1, [frodo]: -1 },
        };
        expect(rsvps).toEqual(expectedAdminResult);
      }).
      then(() => tk.collectRsvps(eventId, 0)).
      then(rsvps => expect(rsvps).toEqual(expectedResult)).
      then(() => tk.collectRsvps(eventId, 2)).
      then(rsvps => expect(rsvps).toEqual(expectedResult)).
      then(() => tk.close());
  });
});

describe('Sqlite Timekeeper Parameter Validation', () => {
  test('duration', () => {
    SqliteTimekeeper.validateDuration('30m');
    expect(() => SqliteTimekeeper.validateDuration()).toThrow();
    expect(() => SqliteTimekeeper.validateDuration('1 sec')).toThrow();
    expect(() => SqliteTimekeeper.validateDuration('90s')).toThrow();
    expect(() => SqliteTimekeeper.validateDuration('90 m')).toThrow();
  });

  test('hhmm', () => {
    SqliteTimekeeper.validateHhMm('12:00');
    SqliteTimekeeper.validateHhMm('1:59');
    SqliteTimekeeper.validateHhMm('23:59');
    expect(() => SqliteTimekeeper.validateHhMm()).toThrow();
    expect(() => SqliteTimekeeper.validateHhMm('11:00 am')).toThrow();
    expect(() => SqliteTimekeeper.validateHhMm('12pm')).toThrow();
    expect(() => SqliteTimekeeper.validateHhMm('12')).toThrow();
    expect(() => SqliteTimekeeper.validateHhMm('noon')).toThrow();
  });

  test('yyyymmdd', () => {
    SqliteTimekeeper.validateYyyyMmDd('2018/12/01');
    SqliteTimekeeper.validateYyyyMmDd('2018-12-01');
    SqliteTimekeeper.validateYyyyMmDd('2018-12-1');
    SqliteTimekeeper.validateYyyyMmDd('2018-2-01');
    expect(() => SqliteTimekeeper.validateYyyyMmDd()).toThrow();
    expect(() => SqliteTimekeeper.validateYyyyMmDd('201-12-01')).toThrow();
    expect(() => SqliteTimekeeper.validateYyyyMmDd('Christmas')).toThrow();
  });
});

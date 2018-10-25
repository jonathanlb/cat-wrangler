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
      then(() => tk.createParticipant(name, secret, true)).
      then(id => expect(id).toBe(1)).
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
});

describe('Sqlite Timekeeper Parameter Validation', () => {
  test('duration', () => {
    SqliteTimekeeper.validateDuration('30m');
    expect(() => SqliteTimekeeper.validateDuration('1 sec')).toThrow();
    expect(() => SqliteTimekeeper.validateDuration('90s')).toThrow();
    expect(() => SqliteTimekeeper.validateDuration('90 m')).toThrow();
  });

  test('hhmm', () => {
    SqliteTimekeeper.validateHhMm('12:00');
    SqliteTimekeeper.validateHhMm('1:59');
    SqliteTimekeeper.validateHhMm('23:59');
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
    expect(() => SqliteTimekeeper.validateYyyyMmDd('201-12-01')).toThrow();
    expect(() => SqliteTimekeeper.validateYyyyMmDd('Christmas')).toThrow();
  });
});

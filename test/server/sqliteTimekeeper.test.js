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
      then(() => tk.getVenues({ id: 1 })).
      then((venues) => {
        expect(venues).toHaveLength(1);
        expect(venues[0].name).toEqual(name);
        expect(venues[0].id).toBe(1);
      }).
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
        return tk.getEvent(id);
      }).
      then((result) => {
        expect(result.name).toEqual(eventName);
        expect(result.description).toEqual('');
        expect(result.venue).toEqual(1);
        return tk.closeEvent(result.id);
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

  test('Uses only most-recent rsvp', () => {
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
      then(() => tk.rsvp(1, 1, 1, 1)).
      then(() => tk.getRsvps(1, 1)).
      then(rsvps => expect(rsvps).toEqual({ 1: 1 })).
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

  test('Joins rsvps to events', () => {
    const eventName = 'Elevensies';
    const venueName = 'The Shire';
    const address = 'It\'s fictional';
    const times = [['2018-12-01', '10:59', '90m'], ['2018-12-01', '11:02', '87m']];
    const tk = new SqliteTimekeeper();
    return tk.setup().
      then(() => tk.createVenue(venueName, address)).
      then(venue => tk.createEvent(eventName, venue)).
      then(id => Promise.all(
        times.map(dt => tk.createDateTime(id, dt[0], dt[1], dt[2])),
      )).
      then(() => tk.rsvp(1, 1, 2, 1)).
      then(() => tk.getEvent(1, 1)).
      then(eventObj => expect(eventObj).toEqual({
        id: 1,
        name: eventName,
        description: '',
        venue: 1,
        dateTime: null,
        dateTimes: [
          {
            id: 1, event: 1, yyyymmdd: '2018-12-01', hhmm: '10:59', duration: '90m', attend: null,
          },
          {
            id: 2, event: 1, yyyymmdd: '2018-12-01', hhmm: '11:02', duration: '87m', attend: 1,
          },
        ],
      })).
      then(() => tk.close());
  });

  test('Closes events with datetime', () => {
    // XXX
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

  test('Collecting RSVPS respects nevers', async () => {
    const tk = new SqliteTimekeeper();

    await tk.setup();
    const bilbo = await tk.createParticipant('Bilbo', 'secret', { organizer: 1 });
    const frodo = await tk.createParticipant('Frodo', 'secret');
    const venue = await tk.createVenue('Baggins End', 'The Shire');
    const eventId = await tk.createEvent('Elevensies', venue, 'Be a hobbit');
    await tk.never(bilbo, '2012-01-01');
    const dt0 = await tk.createDateTime(eventId, '2012-01-01', '10:00', '60m');
    const dt1 = await tk.createDateTime(eventId, '2012-01-02', '10:00', '60m');
    await tk.never(frodo, '2012-01-02');
    await tk.rsvp(eventId, bilbo, dt1, 1);
    await tk.rsvp(eventId, frodo, dt0, 1);

    let rsvpAdminSummary = await tk.collectRsvps(eventId, bilbo);
    let expectedAdminResult = {
      1: { [bilbo]: -1, [frodo]: 1 },
      2: { [bilbo]: 1, [frodo]: -1 },
    };
    expect(rsvpAdminSummary).toEqual(expectedAdminResult);

    await tk.never(bilbo, '2012-01-02');
    rsvpAdminSummary = await tk.collectRsvps(eventId, bilbo);
    expectedAdminResult = {
      1: { [bilbo]: -1, [frodo]: 1 },
      2: { [bilbo]: -1, [frodo]: -1 },
    };
    expect(rsvpAdminSummary).toEqual(expectedAdminResult);

    return tk.close();
  });

  test('Updates user section', async () => {
    const tk = new SqliteTimekeeper();
    await tk.setup();
    await tk.createParticipant('Bilbo', 'secret', { section: 'Hobbit' });
    let sectionResponse = await tk.updateUserSection(1, 'nephew');
    expect(sectionResponse).toEqual('Hobbit');
    await tk.db.runAsync('INSERT INTO sections(name) VALUES (\'adventurer\')');
    sectionResponse = await tk.updateUserSection(1, 'Adventurer');
    expect(sectionResponse).toEqual('adventurer');
    return tk.close();
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

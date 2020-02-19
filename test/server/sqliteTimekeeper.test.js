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
    const tk = new SqliteTimekeeper();
    return tk.setup().
      then(() => tk.createParticipant(name)).
      then(id => expect(id).toBe(1)).
      then(() => tk.close());
  });

  test('Creates organizer participants', () => {
    const name = 'Bilbo Baggins';
    const tk = new SqliteTimekeeper();
    return tk.setup().
      then(() => tk.createParticipant(name, { organizer: true })).
      then(id => expect(id).toBe(1)).
      then(() => tk.close());
  });

  test('Creates venues', () => {
    const name = 'The Shire';
    const address = 'It\'s fictional';
    const tk = new SqliteTimekeeper();
    return tk.setup().
      then(() => tk.createVenue(name, address)).
      then(id => tk.getVenues({ id })).
      then((venues) => {
        expect(venues).toHaveLength(1);
        expect(venues[0].name).toEqual(name);
        expect(venues[0].id).toBeDefined();
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

  test('Handles missing keys', async () => {
    const tk = new SqliteTimekeeper();
    await tk.setup();
    expect(await tk.getValue(1, 'foo')).not.toBeDefined();
  });

  test('Retrieves values for keys', async () => {
    const tk = new SqliteTimekeeper();
    await tk.setup();
    await tk.db.runAsync(
      'INSERT INTO key_value(key, value) VALUES (\'foo\', \'bar\')',
    );
    expect(await tk.getValue(1, 'foo')).toEqual('bar');
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
      then(() => tk.createParticipant(name)).
      then((id) => { userId = id; }).
      then(() => tk.getUserId(name)).
      then(id => expect(id).toEqual(userId)).
      then(() => tk.getUserId('Arwen')).
      then(id => expect(id).toEqual(-1)).
      then(() => tk.close());
  });

  test('Gets user ids from email', () => {
    const name = 'Bilbo Baggin\'';
    const email = 'bilbo@bag.end';
    let userId;
    const tk = new SqliteTimekeeper();
    return tk.setup().
      then(() => tk.createParticipant(name, { email })).
      then((id) => { userId = id; }).
      then(() => tk.getUserIdByEmail(email)).
      then(id => expect(id).toEqual(userId)).
      then(() => tk.close());
  });


  test('Gets user info from ids', () => {
    const name = 'Bilbo Baggin\'';
    let userId;
    const tk = new SqliteTimekeeper();
    return tk.setup().
      then(() => tk.createParticipant(name)).
      then((id) => { userId = id; }).
      then(() => tk.getUserInfo(userId)).
      then(id => expect(id).toEqual({
        email: '',
        id: 1,
        name,
        organizer: 0,
        section: '',
      })).
      then(() => tk.getUserInfo(7)).
      then(id => expect(id).not.toBeDefined()).
      then(() => tk.close());
  });

  // Flashes -- prescribe sorting of events
  test('Joins rsvps to events', async () => {
    const eventName = 'Elevensies';
    const venueName = 'The Shire';
    const address = 'It\'s fictional';
    const times = [['2018-12-01', '10:59', '90m'], ['2018-12-01', '11:02', '87m']];
    const tk = new SqliteTimekeeper();
    await tk.setup();
    const venue = await tk.createVenue(venueName, address);
    const eventId = await tk.createEvent(eventName, venue);
    times.forEach(async (dt) => {
      await tk.createDateTime(eventId, dt[0], dt[1], dt[2]);
    });
    await tk.rsvp(1, 1, 2, 1);
    const eventObj = await tk.getEvent(1, 1);

    // Test is sloppy with dateTime ids, which can get jumbled
    expect(eventObj.dateTimes).toHaveLength(2);
    expect(eventObj.dateTimes.find(x => x.yyyymmdd === '2018-12-01' &&
        x.hhmm === '10:59' &&
        x.duration === '90m')).toBeTruthy();
    expect(eventObj.dateTimes.find(x => x.yyyymmdd === '2018-12-01' &&
        x.hhmm === '11:02' &&
        x.duration === '87m')).toBeTruthy();
    expect(eventObj.dateTimes.reduce(
      (acc, x) => (x.attend ? acc + 1 : acc),
      0,
    )).toBe(1);
    delete eventObj.dateTimes;

    expect(eventObj).toEqual({
      id: 1,
      name: eventName,
      description: '',
      venue: 1,
      dateTime: null,
    });
    await tk.close();
  });

  test('Closes events with datetime', async () => {
    const tk = new SqliteTimekeeper();
    await tk.setup();
    const venueId = await tk.createVenue('Baggins End', 'The Shire');
    const eventId = await tk.createEvent('Elevensies', venueId, 'Be a hobbit');
    await tk.createDateTime(eventId, '2012-01-01', '10:59', '60m');
    await tk.createDateTime(eventId, '2012-01-01', '11:00', '60m');
    const dtId = await tk.createDateTime(eventId, '2012-01-01', '11:01', '60m');
    await tk.closeEvent(eventId, dtId);
    const event = await tk.getEvent(eventId);
    expect(event.dateTime.id).toEqual(dtId);
    return tk.close();
  });

  test('Collects RSVPs', async () => {
    const tk = new SqliteTimekeeper();
    await tk.setup();
    const bilbo = await tk.createParticipant('Bilbo', { organizer: 1 });
    const frodo = await tk.createParticipant('Frodo');
    const venueId = await tk.createVenue('Baggins End', 'The Shire');
    const eventId = await tk.createEvent('Elevensies', venueId, 'Be a hobbit');
    const dt1 = await tk.createDateTime(eventId, '2012-01-01', '10:59', '60m');
    const dt2 = await tk.createDateTime(eventId, '2012-01-01', '10:58', '60m');
    const dt3 = await tk.createDateTime(eventId, '2012-01-01', '10:57', '60m');
    await tk.rsvp(eventId, bilbo, dt1, 1);
    await tk.rsvp(eventId, bilbo, dt2, 1);
    await tk.rsvp(eventId, frodo, dt1, 1);
    await tk.rsvp(eventId, frodo, dt2, -1);

    let rsvps = await tk.collectRsvps(eventId, bilbo);
    const expectedAdminResult = {
      [dt1]: { [bilbo]: 1, [frodo]: 1 },
      [dt2]: { [bilbo]: 1, [frodo]: -1 },
    };
    expect(rsvps).toEqual(expectedAdminResult);

    let expectedResult = {
      [dt1]: { 1: 2 },
      [dt2]: { 1: 1, '-1': 1 },
    };
    rsvps = await tk.summarizeRsvps(eventId);
    expect(rsvps).toEqual(expectedResult);

    rsvps = await tk.summarizeRsvps(eventId, frodo);
    expectedResult = {
      [dt1]: { 1: 2 },
      [dt2]: { 1: 1, '-1': 1 },
      [dt3]: { 0: 1 },
    };
    expect(rsvps).toEqual(expectedResult);
    rsvps = await tk.summarizeRsvps(eventId, frodo);
    expect(rsvps).toEqual(expectedResult);

    return tk.close();
  });

  test('Collecting RSVPS respects nevers', async () => {
    const tk = new SqliteTimekeeper();

    await tk.setup();
    const bilbo = await tk.createParticipant('Bilbo', { organizer: 1 });
    const frodo = await tk.createParticipant('Frodo');
    const venue = await tk.createVenue('Baggins End', 'The Shire');
    const eventId = await tk.createEvent('Elevensies', venue, 'Be a hobbit');
    await tk.never(bilbo, '2012-01-01');
    let rsvpAdminSummary = await tk.collectRsvps(eventId, bilbo);
    let expectedAdminResult = { };
    expect(rsvpAdminSummary).toEqual(expectedAdminResult);

    const dt1 = await tk.createDateTime(eventId, '2012-01-01', '10:00', '60m');
    const dt2 = await tk.createDateTime(eventId, '2012-01-02', '10:00', '60m');
    rsvpAdminSummary = await tk.collectRsvps(eventId, bilbo);
    expectedAdminResult = {
      [dt1]: { [bilbo]: -1 },
    };
    expect(rsvpAdminSummary).toEqual(expectedAdminResult);

    await tk.never(frodo, '2012-01-02');
    rsvpAdminSummary = await tk.collectRsvps(eventId, bilbo);
    expectedAdminResult = {
      [dt1]: { [bilbo]: -1 },
      [dt2]: { [frodo]: -1 },
    };
    expect(rsvpAdminSummary).toEqual(expectedAdminResult);

    await tk.rsvp(eventId, bilbo, dt2, 1);
    await tk.rsvp(eventId, frodo, dt1, 1);
    rsvpAdminSummary = await tk.collectRsvps(eventId, bilbo);
    expectedAdminResult = {
      [dt1]: { [bilbo]: -1, [frodo]: 1 },
      [dt2]: { [bilbo]: 1, [frodo]: -1 },
    };
    expect(rsvpAdminSummary).toEqual(expectedAdminResult);

    await tk.never(bilbo, '2012-01-02');
    rsvpAdminSummary = await tk.collectRsvps(eventId, bilbo);
    expectedAdminResult = {
      [dt1]: { [bilbo]: -1, [frodo]: 1 },
      [dt2]: { [bilbo]: -1, [frodo]: -1 },
    };
    expect(rsvpAdminSummary).toEqual(expectedAdminResult);

    return tk.close();
  });

  test('Gets never attend dates', async () => {
    const tk = new SqliteTimekeeper();
    await tk.setup();
    const id = await tk.createParticipant('Bilbo');
    await tk.never(id, '2012-01-01');
    await tk.never(id, '2012-01-02');
    const nevers = await tk.getNevers(id);
    expect(nevers).toEqual(['2012-01-01', '2012-01-02']);

    const recentNevers = await tk.getNevers(id, '2012-01-01');
    expect(recentNevers).toEqual(['2012-01-02']);
  });

  test('Sets default rsvp to zero on summary', async () => {
    const tk = new SqliteTimekeeper();
    await tk.setup();
    const bilbo = await tk.createParticipant('Bilbo', { organizer: 1 });
    const frodo = await tk.createParticipant('Frodo');
    const venueId = await tk.createVenue('Baggins End', 'The Shire');
    const eventId = await tk.createEvent('Elevensies', venueId, 'Be a hobbit');
    const dt1 = await tk.createDateTime(eventId, '2012-01-01', '10:59', '60m');
    const dt2 = await tk.createDateTime(eventId, '2012-01-01', '10:58', '60m');
    await tk.rsvp(eventId, bilbo, dt1, 1);
    await tk.rsvp(eventId, bilbo, dt2, 1);

    let rsvps = await tk.collectRsvps(eventId, bilbo);
    let expectedAdminResult = {
      [dt1]: { [bilbo]: 1 },
      [dt2]: { [bilbo]: 1 },
    };
    expect(rsvps).toEqual(expectedAdminResult);

    await tk.summarizeRsvps(eventId, frodo);
    rsvps = await tk.collectRsvps(eventId, bilbo);
    expectedAdminResult = {
      [dt1]: { [bilbo]: 1, [frodo]: 0 },
      [dt2]: { [bilbo]: 1, [frodo]: 0 },
    };
    expect(rsvps).toEqual(expectedAdminResult);
    return tk.close();
  });

  test('Updates user section', async () => {
    const tk = new SqliteTimekeeper();
    await tk.setup();
    await tk.createParticipant('Bilbo', { section: 'Hobbit' });
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

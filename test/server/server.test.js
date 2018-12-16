const debug = require('debug')('server');
const express = require('express');
const request = require('supertest');
const Server = require('../../src/server/server');

function createServer() {
  let id = 1;
  const mailer = (mailOpts, next) => {
    if (mailOpts) {
      id += 1;
      debug('sendMail', mailOpts);
      next(undefined, { id });
    } else {
      next(new Error('no mail destination provided'));
    }
  };
  const router = express();
  const server = new Server({ mailer, router });
  return { router, server };
}

describe('Server routing tests', () => {
  test('has default instantiation', () => {
    const { server } = createServer();
    expect(server.timekeeper).toBeDefined();
    return server.setup().
      then(result => expect(result).toBe(server)).
      then(() => server.close());
  });

  test('denies unregistered users', async () => {
    const { router, server } = createServer();
    await server.setup();
    let response = await request(router).get('/event/list/1');
    expect(response.status).toEqual(401);

    response = await request(router).get('/event/list/1').
      set('x-access-token', 'badd Seecret');
    expect(response.status).toEqual(401);
    return server.close();
  });

  test('bootstraps user login', async () => {
    const { router, server } = createServer();
    const tk = server.timekeeper;
    await server.setup();
    await tk.createParticipant('Pogo', 'secret');
    let response = await request(router).get('/user/bootstrap/Pogo').
      set('x-access-token', 'badsecret');
    expect(response.status).toEqual(401);
    response = await request(router).get('/user/bootstrap/Pogo').
      set('x-access-token', 'secret');
    expect(JSON.parse(response.text).id).toEqual(1);
    return server.close();
  });

  test('serves event get requests', async () => {
    const { router, server } = createServer();
    const eventName = 'Kazoo Recital';
    const eventDescription = 'It\'s all the buzz';
    const tk = server.timekeeper;
    await server.setup();
    await tk.createParticipant('Pogo', 'secret');
    await tk.createEvent(eventName, 1, eventDescription);
    await tk.createEvent(`${eventName} again`, 1, `${eventDescription}, II`);
    let response = await request(router).get('/event/list/1').
      set('x-access-token', 'secret');
    expect(response.text).toEqual(JSON.stringify([1, 2]));
    response = await request(router).get('/event/list/1'); // no secret
    expect(response.status).toEqual(401);
    response = await request(router).get('/event/get/1/1').
      set('x-access-token', 'secret');
    expect(response.status).toEqual(200);
    const eventObj = JSON.parse(response.text);
    expect(eventObj.name).toEqual(eventName);
    expect(eventObj.description).toEqual(eventDescription);
    expect(eventObj.id).toEqual(1);

    response = await request(router).get('/event/get/1/1').
      set('x-access-token', 'bad-secret');
    expect(response.status).toEqual(401);
    response = await request(router).get('/event/get/1/100').
      set('x-access-token', 'secret');
    expect(response.status, response.text).toEqual(404);

    response = await request(router).get(`/event/list/1/${JSON.stringify({ id: 1 })}`).
      set('x-access-token', 'secret');
    expect(JSON.parse(response.text)).toEqual([1]);

    tk.getEvents = undefined;
    response = await request(router).get('/event/list/1').
      set('x-access-token', 'secret');
    expect(response.status).toEqual(500);

    tk.getEvent = undefined;
    response = await request(router).get('/event/get/1/1').
      set('x-access-token', 'secret');
    expect(response.status).toEqual(500);

    return server.close();
  });

  test('serves rsvp route', async () => {
    const { router, server } = createServer();
    const eventName = 'Kazoo Recital';
    const eventDescription = 'It\'s all the buzz';
    const tk = server.timekeeper;
    await server.setup();
    await tk.createParticipant('Pogo', 'secret');
    await tk.createEvent(eventName, 1, eventDescription);
    await tk.createDateTime(1, '2012-01-01', '12:00', '20m');
    await tk.createDateTime(1, '2012-01-02', '12:00', '20m');
    let response = await request(router).get('/event/rsvp/1/1/1/-1').
      set('x-access-token', 'secret');
    expect(response.status).toEqual(200);
    response = await request(router).get('/event/rsvp/1/1/2/1').
      set('x-access-token', 'secret');
    expect(response.status).toEqual(200);
    response = await request(router).get('/event/rsvp/1/1/2/1').
      set('x-access-token', 'notsecret');
    expect(response.status).toEqual(401);
    response = await request(router).get('/event/rsvp/1/1').
      set('x-access-token', 'secret');
    expect(response.text).toEqual(JSON.stringify({ 1: -1, 2: 1 }));
    response = await request(router).get('/event/rsvp/1/1').
      set('x-access-token', 'notsecret');
    expect(response.status).toEqual(401);

    tk.rsvp = undefined;
    response = await request(router).get('/event/rsvp/1/1/2/1').
      set('x-access-token', 'secret');
    expect(response.status).toEqual(500);

    tk.getRsvps = undefined;
    response = await request(router).get('/event/rsvp/1/1').
      set('x-access-token', 'secret');
    expect(response.status).toEqual(500);

    return server.close();
  });

  test('serves event summary', async () => {
    const { router, server } = createServer();
    const eventName = 'Kazoo Recital';
    const eventDescription = 'It\'s all the buzz';
    const tk = server.timekeeper;
    await server.setup();
    await tk.createParticipant('Pogo', 'psecret');
    await tk.createParticipant('Churchy', 'csecret');
    await tk.createParticipant('Beauregard', 'bsecret');
    await tk.createEvent(eventName, 1, eventDescription);
    await tk.createDateTime(1, '2012-01-01', '12:00', '20m');
    await tk.createDateTime(1, '2012-01-02', '12:00', '20m');
    await request(router).get('/event/rsvp/1/1/1/-1').
      set('x-access-token', 'psecret');
    await request(router).get('/event/rsvp/1/1/2/1').
      set('x-access-token', 'psecret');
    await request(router).get('/event/rsvp/2/1/1/1').
      set('x-access-token', 'csecret');
    await request(router).get('/event/rsvp/2/1/2/1').
      set('x-access-token', 'csecret');
    await request(router).get('/event/rsvp/3/1/1/1').
      set('x-access-token', 'bsecret');
    await request(router).get('/event/rsvp/3/1/2/0').
      set('x-access-token', 'bsecret');
    const result = await request(router).get('/event/summary/3/1').
      set('x-access-token', 'bsecret');
    const expected = {
      1: { '-1': 1, 1: 2 },
      2: { 0: 1, 1: 2 },
    };
    expect(JSON.parse(result.text)).toEqual(expected);
    let response = await request(router).get('/event/summary/3/1').
      set('x-access-token', 'notsecret');
    expect(response.status).toEqual(401);

    tk.collectRsvps = undefined;
    response = await request(router).get('/event/summary/3/1').
      set('x-access-token', 'bsecret');
    expect(response.status).toEqual(500);
    return server.close();
  });
  // XXXXXXXXXXX edit below
  test('joins user rsvp to event get requests', () => {
    const { router, server } = createServer();
    const eventName = 'Kazoo Recital';
    const eventDescription = 'It\'s all the buzz';
    const tk = server.timekeeper;
    return server.setup().
      then(() => tk.createParticipant('Pogo', 'secret')).
      then(() => tk.createEvent(eventName, 1, eventDescription)).
      then(() => tk.createDateTime(1, '2018-12-01', '11:00', '15m')).
      then(() => tk.createDateTime(1, '2018-12-01', '13:00', '15m')).
      then(() => tk.rsvp(1, 1, 1, -1)).
      then(() => tk.rsvp(1, 1, 2, 1)).
      then(() => request(router).get('/event/get/1/1').
        set('x-access-token', 'secret')).
      then((response) => {
        const eventObj = JSON.parse(response.text);
        expect(eventObj.dateTimes).toEqual([{
          id: 1,
          event: 1,
          yyyymmdd: '2018-12-01',
          hhmm: '11:00',
          duration: '15m',
          attend: -1,
        },
        {
          id: 2,
          event: 1,
          yyyymmdd: '2018-12-01',
          hhmm: '13:00',
          duration: '15m',
          attend: 1,
        }]);
      }).
      then(() => tk.closeEvent(1, 2)).
      then(() => request(router).get('/event/get/1/1').
        set('x-access-token', 'secret')).
      then((response) => {
        const eventObj = JSON.parse(response.text);
        expect(eventObj.dateTime).toEqual({
          id: 2,
          event: 1,
          yyyymmdd: '2018-12-01',
          hhmm: '13:00',
          duration: '15m',
          attend: 1,
        });
      }).
      then(() => server.close());
  });

  test('resets and updates password', async () => {
    const { router, server } = createServer();
    const tk = server.timekeeper;
    const name = 'Bilbo';

    let newPassword;
    server.mailer = (mailOpts) => {
      const regexpMatch = mailOpts.text.match(/temporary password ([^ ]*) \./);
      newPassword = regexpMatch[1]; // eslint-disable-line prefer-destructuring
    };

    await server.setup();
    await tk.createParticipant(name, 'secret', { email: 'bilbo@here' });
    let response = await request(router).get(`/password/reset/${name}`).
      set('x-access-token', 'secret');
    expect(response.status).toBe(200);
    expect(response.text).toEqual('OK');
    expect(newPassword).toBeDefined();

    response = await request(router).
      get(`/user/bootstrap/${name}`).
      set('x-access-token', newPassword);
    expect(response.status).toEqual(200);
    expect(JSON.parse(response.text).id).toEqual(1);

    response = await request(router).
      get('/password/change/1/anothersecret').
      set('x-access-token', newPassword);
    expect(response.status).toEqual(200);

    return server.close();
  });

  test('resets password in log w/o email address', async () => {
    const { router, server } = createServer();
    const tk = server.timekeeper;
    const name = 'Bilbo';

    await server.setup();
    await tk.createParticipant(name, 'secret');
    const response = await request(router).get(`/password/reset/${name}`).
      set('x-access-token', 'secret');
    // XXX check log?
    expect(response.status).toBe(200);
    expect(response.text).toEqual('OK');
    return server.close();
  });

  test('resets password in log w/o mailer', async () => {
    const { router, server } = createServer();
    server.mailer = undefined;
    const tk = server.timekeeper;
    const name = 'Bilbo';

    await server.setup();
    await tk.createParticipant(name, 'secret', { email: 'bilbo@here' });
    const response = await request(router).get(`/password/reset/${name}`).
      set('x-access-token', 'secret');
    // XXX check log?
    expect(response.status).toBe(200);
    expect(response.text).toEqual('OK');
    return server.close();
  });

  test('serves event detail', () => {
    const { router, server } = createServer();
    const eventName = 'Kazoo Recital';
    const eventDescription = 'It\'s all the buzz';
    const tk = server.timekeeper;
    return server.setup().
      then(() => tk.createParticipant('Pogo', 'psecret')).
      then(() => tk.createParticipant('Churchy', 'csecret')).
      then(() => tk.createParticipant('Beauregard', 'bsecret', { organizer: true })).
      then(() => tk.createEvent(eventName, 1, eventDescription)).
      then(() => tk.createDateTime(1, '2012-01-01', '12:00', '20m')).
      then(() => tk.createDateTime(1, '2012-01-02', '12:00', '20m')).
      then(() => request(router).get('/event/rsvp/1/1/1/-1').
        set('x-access-token', 'psecret')).
      then(() => request(router).get('/event/rsvp/1/1/2/1').
        set('x-access-token', 'psecret')).
      then(() => request(router).get('/event/rsvp/2/1/1/1').
        set('x-access-token', 'csecret')).
      then(() => request(router).get('/event/rsvp/2/1/2/1').
        set('x-access-token', 'csecret')).
      then(() => request(router).get('/event/rsvp/3/1/1/1').
        set('x-access-token', 'bsecret')).
      then(() => request(router).get('/event/rsvp/3/1/2/0').
        set('x-access-token', 'bsecret')).
      then(() => request(router).get('/event/detail/3/1').
        set('x-access-token', 'bsecret')).
      then((result) => {
        const expected = {
          1: { 1: -1, 2: 1, 3: 1 },
          2: { 1: 1, 2: 1, 3: 0 },
        };
        expect(JSON.parse(result.text)).toEqual(expected);
      }).
      then(() => request(router).get('/event/detail/1/1').
        set('x-access-token', 'notsecret')).
      then(response => expect(response.status).toEqual(401)).
      then(() => request(router).get('/event/detail/1/1').
        set('x-access-token', 'psecret')).
      then((result) => {
        const expected = {
          1: { '-1': 1, 1: 2 },
          2: { 0: 1, 1: 2 },
        };
        return expect(JSON.parse(result.text)).toEqual(expected);
      }).
      then(() => server.close());
  });

  test('serves get user', () => {
    const { router, server } = createServer();
    const tk = server.timekeeper;
    return server.setup().
      then(() => tk.createParticipant('Pogo', 'psecret')).
      then(() => tk.createParticipant('Churchy', 'csecret', { section: 'kazoo' })).
      then(() => tk.createParticipant('Beauregard', 'bsecret', { organizer: true })).
      then(() => request(router).get('/user/get/1/3').
        set('x-access-token', 'notsecret')).
      then(response => expect(response.status).toEqual(401)).
      then(() => request(router).get('/user/id/1/who').
        set('x-access-token', 'notsecret')).
      then(response => expect(response.status).toEqual(401)).
      then(() => request(router).get('/user/id/1/who').
        set('x-access-token', 'psecret')).
      then(response => expect(response.status).toEqual(404)).
      then(() => request(router).get('/user/get/1/3').
        set('x-access-token', 'psecret')).
      then(response => expect(JSON.parse(response.text)).toEqual({
        email: '',
        id: 3,
        name: 'Beauregard',
        organizer: 1,
        section: '',
      })).
      then(() => request(router).get('/user/get/2/2').
        set('x-access-token', 'csecret')).
      then(response => expect(JSON.parse(response.text)).toEqual({
        email: '',
        id: 2,
        name: 'Churchy',
        organizer: 0,
        section: 'kazoo',
      })).
      then(() => request(router).get('/user/id/2/Pogo').
        set('x-access-token', 'csecret')).
      then(response => expect(response.text).toEqual('1')).
      then(() => {
        tk.getUserInfo = undefined;
        return request(router).get('/user/get/2/2').
          set('x-access-token', 'csecret');
      }).
      then(response => expect(response.status).toEqual(500)).
      then(() => {
        tk.getUserId = undefined;
        return request(router).get('/user/id/2/Pogo').
          set('x-access-token', 'csecret');
      }).
      then(response => expect(response.status).toEqual(500)).
      then(() => server.close());
  });

  test('serves get venue', async () => {
    const { router, server } = createServer();
    const tk = server.timekeeper;
    await server.setup();
    await tk.createParticipant('Pogo', 'secret');
    await tk.createVenue('The Hollow', 'Right around the corner');
    await tk.createVenue('Shady Grove', 'Dunno');
    let response = await request(router).get('/venue/list/1').
      set('x-access-token', 'secret');
    expect(JSON.parse(response.text)).toEqual([
      {
        id: 1,
        name: 'The Hollow',
        address: 'Right around the corner',
      }, {
        id: 2,
        name: 'Shady Grove',
        address: 'Dunno',
      },
    ]);
    response = await request(router).get('/venue/list/2').
      set('x-access-token', 'secret');
    expect(response.status).toEqual(401);
    response = await request(router).get(`/venue/list/1/${JSON.stringify({ name: 'Grove' })}`).
      set('x-access-token', 'secret');
    expect(JSON.parse(response.text)).toEqual([
      {
        id: 2,
        name: 'Shady Grove',
        address: 'Dunno',
      },
    ]);
    response = await request(router).get('/venue/get/1/1').
      set('x-access-token', 'secret');
    expect(JSON.parse(response.text)).toEqual(
      {
        id: 1,
        name: 'The Hollow',
        address: 'Right around the corner',
      },
    );
    response = await request(router).get('/venue/get/1/1').
      set('x-access-token', 'notsecret');
    expect(response.status).toEqual(401);
    response = await request(router).get('/venue/get/1/3').
      set('x-access-token', 'secret');
    expect(response.status).toEqual(404);

    tk.getVenues = undefined;
    response = await request(router).get('/venue/get/1/3').
      set('x-access-token', 'secret');
    expect(response.status).toEqual(500);
    response = await request(router).get('/venue/list/1').
      set('x-access-token', 'secret');
    expect(response.status).toEqual(500);
    return server.close();
  });

  test('serves datetime get', () => {
    const { router, server } = createServer();
    const tk = server.timekeeper;
    return server.setup().
      then(() => tk.createParticipant('Pogo', 'secret')).
      then(() => tk.createDateTime(7, '2018-12-01', '10:00', '5m')).
      then(() => tk.createDateTime(3, '2018-12-01', '10:00', '5m')).
      then(() => tk.createDateTime(7, '2018-12-02', '10:15', '5m')).
      then(() => tk.createDateTime(7, '2018-12-03', '10:20', '5m')).
      then(() => request(router).get('/datetime/get/3/7').
        set('x-access-token', 'secret')).
      then(response => expect(response.status).toEqual(401)).
      then(() => request(router).get('/datetime/get/1/4').
        set('x-access-token', 'secret')).
      then(response => expect(JSON.parse(response.text)).toEqual(
        {
          id: 4, event: 7, yyyymmdd: '2018-12-03', hhmm: '10:20', duration: '5m',
        },
      )).
      then(() => {
        tk.getDatetime = undefined;
        return request(router).get('/datetime/get/1/4').
          set('x-access-token', 'secret');
      }).
      then(response => expect(response.status).toEqual(500)).
      then(() => server.close());
  });

  test('serves never attend dates', async () => {
    const { router, server } = createServer();
    const tk = server.timekeeper;
    await server.setup();
    const userId = await tk.createParticipant('Pogo', 'secret');
    let result = await request(router).get(`/event/nevers/${userId}`).
      set('x-access-token', 'secret');
    expect(result.status).toEqual(200);
    expect(result.text).toEqual('[]');
    await request(router).get(`/event/never/${userId}/2999-12-31`).
      set('x-access-token', 'secret');
    await request(router).get(`/event/never/${userId}/2999-12-30`).
      set('x-access-token', 'secret');
    await request(router).get(`/event/never/${userId}/1999-12-31`).
      set('x-access-token', 'secret');
    result = await request(router).get(`/event/nevers/${userId}`).
      set('x-access-token', 'secret');
    expect(result.status).toEqual(200);
    expect(JSON.parse(result.text)).toEqual(['2999-12-30', '2999-12-31']);

    result = await request(router).get(`/event/nevers/${userId}`).
      set('x-access-token', 'Secret');
    expect(result.status).toEqual(401);

    result = await request(router).get(`/event/never/${userId}/2018-12-01`).
      set('x-access-token', 'Secret');
    expect(result.status).toEqual(401);

    return server.close();
  });

  test('serves OK on bad user-name password request', async () => {
    const { router, server } = createServer();
    await server.setup();
    const response = await request(router).get('/password/reset/bogus').
      set('x-access-token', 'secret');
    // XXX check log?
    expect(response.status).toBe(200);
    expect(response.text).toEqual('OK');
    return server.close();
  });

  test('serves password changes', async () => {
    const { router, server } = createServer();
    const tk = server.timekeeper;
    await server.setup();
    const userId = await tk.createParticipant('Pogo', 'secret');
    let result = await request(router).get(`/password/change/${userId}/new-password`).
      set('x-access-token', 'secret');
    expect(result.text).toEqual('OK');

    result = await request(router).get(`/password/change/${userId}/another-password`).
      set('x-access-token', 'secret');
    expect(result.status).toEqual(401);

    return server.close();
  });

  test('updates user section', async () => {
    const { router, server } = createServer();
    const tk = server.timekeeper;
    await server.setup();
    await tk.createParticipant('Pogo', 'secret', { section: 'bear' });
    let result = await request(router).get('/user/update-section/1/opossum').
      set('x-access-token', 'secret');
    expect(result.text).toEqual('bear');

    await tk.db.runAsync('INSERT INTO sections(name) VALUES (\'opossum\')');
    result = await request(router).get('/user/update-section/1/opossum').
      set('x-access-token', 'secret');
    expect(result.text).toEqual('opossum');

    result = await request(router).get('/user/update-section/1/opossum').
      set('x-access-token', 'seeeecret');
    expect(result.status).toEqual(401);

    return server.close();
  });
});

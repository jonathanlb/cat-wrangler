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

  test('denies unregistered users', () => {
    const { router, server } = createServer();
    return server.setup().
      then(() => request(router).get('/event/list/secret/1')).
      then(response => expect(response.status).toEqual(401)).
      then(() => server.close());
  });

  test('bootstraps user login', () => {
    const { router, server } = createServer();
    const tk = server.timekeeper;
    return server.setup().
      then(() => tk.createParticipant('Pogo', 'secret')).
      then(() => request(router).get('/user/bootstrap/badsecret/Pogo')).
      then(response => expect(response.status).toEqual(401)).
      then(() => request(router).get('/user/bootstrap/secret/Pogo')).
      then(response => expect(JSON.parse(response.text).id).toEqual(1)).
      then(() => server.close());
  });

  test('serves event get requests', () => {
    const { router, server } = createServer();
    const eventName = 'Kazoo Recital';
    const eventDescription = 'It\'s all the buzz';
    const tk = server.timekeeper;
    return server.setup().
      then(() => tk.createParticipant('Pogo', 'secret')).
      then(() => tk.createEvent(eventName, 1, eventDescription)).
      then(() => tk.createEvent(`${eventName} again`, 1, `${eventDescription}, II`)).
      then(() => request(router).get('/event/list/secret/1')).
      then(response => expect(response.text).toEqual(JSON.stringify([1, 2]))).
      then(() => request(router).get('/event/list/nosecret/1')).
      then(response => expect(response.status).toEqual(401)).
      then(() => request(router).get('/event/get/secret/1/1')).
      then((response) => {
        const eventObj = JSON.parse(response.text);
        expect(eventObj.name).toEqual(eventName);
        expect(eventObj.description).toEqual(eventDescription);
        expect(eventObj.id).toEqual(1);
      }).
      then(() => request(router).get('/event/get/nosecret/1/1')).
      then(response => expect(response.status).toEqual(401)).
      then(() => request(router).get('/event/get/secret/1/100')).
      then(response => expect(response.status, response.text).toEqual(404)).
      then(() => request(router).get(`/event/list/secret/1/${JSON.stringify({ id: 1 })}`)).
      then(response => expect(JSON.parse(response.text)).toEqual([1])).
      then(() => {
        tk.getEvents = undefined;
        return request(router).get('/event/list/secret/1');
      }).
      then(response => expect(response.status).toEqual(500)).
      then(() => {
        tk.getEvent = undefined;
        return request(router).get('/event/get/secret/1/1');
      }).
      then(response => expect(response.status).toEqual(500)).
      then(() => server.close());
  });

  test('serves rsvp route', () => {
    const { router, server } = createServer();
    const eventName = 'Kazoo Recital';
    const eventDescription = 'It\'s all the buzz';
    const tk = server.timekeeper;
    return server.setup().
      then(() => tk.createParticipant('Pogo', 'secret')).
      then(() => tk.createEvent(eventName, 1, eventDescription)).
      then(() => tk.createDateTime(1, '2012-01-01', '12:00', '20m')).
      then(() => tk.createDateTime(1, '2012-01-02', '12:00', '20m')).
      then(() => request(router).get('/event/rsvp/secret/1/1/1/-1')).
      then(() => request(router).get('/event/rsvp/secret/1/1/2/1')).
      then(() => request(router).get('/event/rsvp/notsecret/1/1/2/1')).
      then(response => expect(response.status).toEqual(401)).
      then(() => request(router).get('/event/rsvp/secret/1/1')).
      then(response => expect(response.text).toEqual(JSON.stringify({ 1: -1, 2: 1 }))).
      then(() => request(router).get('/event/rsvp/notsecret/1/1')).
      then(response => expect(response.status).toEqual(401)).
      then(() => {
        tk.rsvp = undefined;
        return request(router).get('/event/rsvp/secret/1/1/2/1');
      }).
      then(response => expect(response.status).toEqual(500)).
      then(() => {
        tk.getRsvps = undefined;
        return request(router).get('/event/rsvp/secret/1/1');
      }).
      then(response => expect(response.status).toEqual(500)).
      then(() => server.close());
  });

  test('serves event summary', () => {
    const { router, server } = createServer();
    const eventName = 'Kazoo Recital';
    const eventDescription = 'It\'s all the buzz';
    const tk = server.timekeeper;
    return server.setup().
      then(() => tk.createParticipant('Pogo', 'psecret')).
      then(() => tk.createParticipant('Churchy', 'csecret')).
      then(() => tk.createParticipant('Beauregard', 'bsecret')).
      then(() => tk.createEvent(eventName, 1, eventDescription)).
      then(() => tk.createDateTime(1, '2012-01-01', '12:00', '20m')).
      then(() => tk.createDateTime(1, '2012-01-02', '12:00', '20m')).
      then(() => request(router).get('/event/rsvp/psecret/1/1/1/-1')).
      then(() => request(router).get('/event/rsvp/psecret/1/1/2/1')).
      then(() => request(router).get('/event/rsvp/csecret/2/1/1/1')).
      then(() => request(router).get('/event/rsvp/csecret/2/1/2/1')).
      then(() => request(router).get('/event/rsvp/bsecret/3/1/1/1')).
      then(() => request(router).get('/event/rsvp/bsecret/3/1/2/0')).
      then(() => request(router).get('/event/summary/bsecret/3/1')).
      then((result) => {
        const expected = {
          1: { '-1': 1, 1: 2 },
          2: { 0: 1, 1: 2 },
        };
        expect(JSON.parse(result.text)).toEqual(expected);
      }).
      then(() => request(router).get('/event/summary/notsecret/3/1')).
      then(response => expect(response.status).toEqual(401)).
      then(() => {
        tk.collectRsvps = undefined;
        return request(router).get('/event/summary/bsecret/3/1');
      }).
      then(response => expect(response.status).toEqual(500)).
      then(() => server.close());
  });

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
      then(() => request(router).get('/event/get/secret/1/1')).
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
      then(() => request(router).get('/event/get/secret/1/1')).
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
      newPassword = regexpMatch[1];
    }

    await server.setup();
    await tk.createParticipant(name, 'secret', { email: 'bilbo@here' });
    let response = await request(router).get(`/password/reset/${name}`);
    expect(response.status).toBe(200);
    expect(response.text).toEqual('OK');
    expect(newPassword).toBeDefined();

    response = await request(router).
      get(`/user/bootstrap/${newPassword}/${name}`);
    expect(response.status).toEqual(200);
    expect(JSON.parse(response.text).id).toEqual(1);

    response = await request(router).
      get(`/password/change/${newPassword}/1/anothersecret`);
    expect(response.status).toEqual(200);

    return server.close();
  });

  test('resets password in log w/o email address', async () => {
    const { router, server } = createServer();
    const tk = server.timekeeper;
    const name = 'Bilbo';

    await server.setup();
    await tk.createParticipant(name, 'secret');
    const response = await request(router).get(`/password/reset/${name}`);
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
    const response = await request(router).get(`/password/reset/${name}`);
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
      then(() => request(router).get('/event/rsvp/psecret/1/1/1/-1')).
      then(() => request(router).get('/event/rsvp/psecret/1/1/2/1')).
      then(() => request(router).get('/event/rsvp/csecret/2/1/1/1')).
      then(() => request(router).get('/event/rsvp/csecret/2/1/2/1')).
      then(() => request(router).get('/event/rsvp/bsecret/3/1/1/1')).
      then(() => request(router).get('/event/rsvp/bsecret/3/1/2/0')).
      then(() => request(router).get('/event/detail/bsecret/3/1')).
      then((result) => {
        const expected = {
          1: { 1: -1, 2: 1, 3: 1 },
          2: { 1: 1, 2: 1, 3: 0 },
        };
        expect(JSON.parse(result.text)).toEqual(expected);
      }).
      then(() => request(router).get('/event/detail/notsecret/1/1')).
      then(response => expect(response.status).toEqual(401)).
      then(() => request(router).get('/event/detail/psecret/1/1')).
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
      then(() => request(router).get('/user/get/notsecret/1/3')).
      then(response => expect(response.status).toEqual(401)).
      then(() => request(router).get('/user/id/notsecret/1/who')).
      then(response => expect(response.status).toEqual(401)).
      then(() => request(router).get('/user/id/psecret/1/who')).
      then(response => expect(response.status).toEqual(404)).
      then(() => request(router).get('/user/get/psecret/1/3')).
      then(response => expect(JSON.parse(response.text)).toEqual({
        email: '',
        id: 3,
        name: 'Beauregard',
        organizer: 1,
        section: '',
      })).
      then(() => request(router).get('/user/get/csecret/2/2')).
      then(response => expect(JSON.parse(response.text)).toEqual({
        email: '',
        id: 2,
        name: 'Churchy',
        organizer: 0,
        section: 'kazoo',
      })).
      then(() => request(router).get('/user/id/csecret/2/Pogo')).
      then(response => expect(response.text).toEqual('1')).
      then(() => {
        tk.getUserInfo = undefined;
        return request(router).get('/user/get/csecret/2/2');
      }).
      then(response => expect(response.status).toEqual(500)).
      then(() => {
        tk.getUserId = undefined;
        return request(router).get('/user/id/csecret/2/Pogo');
      }).
      then(response => expect(response.status).toEqual(500)).
      then(() => server.close());
  });

  test('serves get venue', () => {
    const { router, server } = createServer();
    const tk = server.timekeeper;
    return server.setup().
      then(() => tk.createParticipant('Pogo', 'secret')).
      then(() => tk.createVenue('The Hollow', 'Right around the corner')).
      then(() => tk.createVenue('Shady Grove', 'Dunno')).
      then(() => request(router).get('/venue/list/secret/1')).
      then(response => expect(JSON.parse(response.text)).toEqual([
        {
          id: 1,
          name: 'The Hollow',
          address: 'Right around the corner',
        }, {
          id: 2,
          name: 'Shady Grove',
          address: 'Dunno',
        },
      ])).
      then(() => request(router).get('/venue/list/secret/2')).
      then(response => expect(response.status).toEqual(401)).
      then(() => request(router).get(`/venue/list/secret/1/${JSON.stringify({ name: 'Grove' })}`)).
      then(response => expect(JSON.parse(response.text)).toEqual([
        {
          id: 2,
          name: 'Shady Grove',
          address: 'Dunno',
        },
      ])).
      then(() => request(router).get('/venue/get/secret/1/1')).
      then(response => expect(JSON.parse(response.text)).toEqual(
        {
          id: 1,
          name: 'The Hollow',
          address: 'Right around the corner',
        },
      )).
      then(() => request(router).get('/venue/get/notsecret/1/1')).
      then(response => expect(response.status).toEqual(401)).
      then(() => request(router).get('/venue/get/secret/1/3')).
      then(response => expect(response.status).toEqual(404)).
      then(() => {
        tk.getVenues = undefined;
        return request(router).get('/venue/get/secret/1/3');
      }).
      then(response => expect(response.status).toEqual(500)).
      then(() => request(router).get('/venue/list/secret/1')).
      then(response => expect(response.status).toEqual(500)).
      then(() => server.close());
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
      then(() => request(router).get('/datetime/get/secret/3/7')).
      then(response => expect(response.status).toEqual(401)).
      then(() => request(router).get('/datetime/get/secret/1/4')).
      then(response => expect(JSON.parse(response.text)).toEqual(
        {
          id: 4, event: 7, yyyymmdd: '2018-12-03', hhmm: '10:20', duration: '5m',
        },
      )).
      then(() => {
        tk.getDatetime = undefined;
        return request(router).get('/datetime/get/secret/1/4');
      }).
      then(response => expect(response.status).toEqual(500)).
      then(() => server.close());
  });

  test('serves never attend dates', async () => {
    const { router, server } = createServer();
    const tk = server.timekeeper;
    await server.setup();
    const userId = await tk.createParticipant('Pogo', 'secret');
    let result = await request(router).get(`/event/nevers/secret/${userId}`);
    expect(result.status).toEqual(200);
    expect(result.text).toEqual('[]');
    await request(router).get(`/event/never/secret/${userId}/2999-12-31`);
    await request(router).get(`/event/never/secret/${userId}/2999-12-30`);
    await request(router).get(`/event/never/secret/${userId}/1999-12-31`);
    result = await request(router).get(`/event/nevers/secret/${userId}`);
    expect(result.status).toEqual(200);
    expect(JSON.parse(result.text)).toEqual(['2999-12-30', '2999-12-31']);

    result = await request(router).get(`/event/nevers/Secret/${userId}`);
    expect(result.status).toEqual(401);

    result = await request(router).get(`/event/never/Secret/${userId}/2018-12-01`);
    expect(result.status).toEqual(401);

    return server.close();
  });

  test('serves OK on bad user-name password request', async () => {
    const { router, server } = createServer();
    await server.setup();
    const response = await request(router).get('/password/reset/bogus');
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
    let result = await request(router).get(`/password/change/secret/${userId}/new-password`);
    expect(result.text).toEqual('OK');

    result = await request(router).get(`/password/change/secret/${userId}/another-password`);
    expect(result.status).toEqual(401);

    return server.close();
  });

  test('updates user section', async () => {
    const { router, server } = createServer();
    const tk = server.timekeeper;
    await server.setup();
    await tk.createParticipant('Pogo', 'secret', { section: 'bear' });
    let result = await request(router).get('/user/update-section/secret/1/opossum');
    expect(result.text).toEqual('bear');

    await tk.db.runAsync('INSERT INTO sections(name) VALUES (\'opossum\')');
    result = await request(router).get('/user/update-section/secret/1/opossum');
    expect(result.text).toEqual('opossum');

    result = await request(router).get('/user/update-section/seeeecret/1/opossum');
    expect(result.status).toEqual(401);

    return server.close();
  });
});

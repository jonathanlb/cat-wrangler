const debug = require('debug')('server');
const express = require('express');
const request = require('supertest');
const Server = require('../../src/server/server');

/** Return a session for the user. */
async function bootstrap(router, user) {
  const response = await request(router).
    get(`/user/bootstrap/${user.name}`).
    set('x-access-token', user.password);
  const session = response.get('x-access-token');
  if (!session) {
    throw new Error(`failed bootstrap for ${user}`);
  }
  return session;
}

function createServer() {
  const auth = {
    method: 'simple-auth',
    dbFileName: ':memory:',
    privateKeyFileName: 'test/server/jwtRS256.key',
    publicKeyFileName: 'test/server/jwtRS256.key.pub',
  };
  const router = express();
  const server = new Server({ auth, router });
  return { router, server };
}

const BEAUREGARD_USER = {
  email: 'hound@wo.of',
  name: 'Beauregard',
  password: 'bsecret',
};

const CHURCHY_USER = {
  email: 'churchy@in.sh',
  name: 'Churchy',
  password: 'csecret',
  section: 'kazoo',
};

const POGO_USER = {
  email: 'possum@aol.com',
  name: 'Pogo',
  organizer: true,
  password: 'secret',
  section: 'bear',
};

async function createUser(server, userInfo) {
  const id = await server.timekeeper.createParticipant(userInfo.name, userInfo);
  const user = Object.assign({ id }, userInfo);
  await server.auth.createUser(user);
  return user;
}

describe('Server routing tests', () => {
  test('has default instantiation', () => {
    const { server } = createServer();
    expect(server.timekeeper).toBeDefined();
    return server.setup().
      then(result => expect(result).toBe(server)).
      then(() => server.close());
  });

  test('has cognito instantiation', async () => {
    const router = express();
    const auth = {
      method: 'cognito-auth',
    };
    const server = new Server({ router, auth });
    await server.setup();
    expect(server.authSession).toBeDefined();
    expect(server.authUser).toBeDefined();
    return server.close();
  });

  test('has simple-auth instantiation', async () => {
    const router = express();
    const auth = {
      method: 'simple-auth',
      dbFileName: ':memory:',
      privateKeyFileName: 'test/server/jwtRS256.key',
      publicKeyFileName: 'test/server/jwtRS256.key.pub',
    };
    const server = new Server({ router, auth });
    await server.setup();
    expect(server.authSession).toBeDefined();
    expect(server.authUser).toBeDefined();
    return server.close();
  });

  test('liveness check', async () => {
    const { server, router } = createServer();
    await server.setup();
    const response = await request(router).get('/alive');
    expect(response.status).toEqual(200);
  });

  test('denies unregistered users', async () => {
    const { router, server } = createServer();
    await server.setup();
    let response = await request(router).get('/event/list/1');
    expect(response.status).toEqual(401);

    response = await request(router).get('/event/list/1').
      set('x-access-token', 'badd Seecret');
    expect(response.status).toEqual(403);
    return server.close();
  });

  test('denies unregistered users key-value lookup', async () => {
    const { router, server } = createServer();
    await server.setup();
    let response = await request(router).get('/key/1/foo');
    expect(response.status).toEqual(401);

    response = await request(router).get('/key/1/foo').
      set('x-access-token', 'badd Seecret');
    expect(response.status).toEqual(403);
    return server.close();
  });

  test('bootstraps user login', async () => {
    const { router, server } = createServer();
    await server.setup();
    const userId = await createUser(server, POGO_USER);
    let response = await request(router).get('/user/bootstrap/Pogo').
      set('x-access-token', 'badsecret');
    expect(response.status).toEqual(403);
    expect(response.get('x-access-token')).not.toBeTruthy();

    response = await request(router).get('/user/bootstrap/Pogo').
      set('x-access-token', userId.password);
    expect(response.text).toBeTruthy();
    expect(response.get('x-access-token')).toBeTruthy();

    const responseObj = JSON.parse(response.text);
    expect(responseObj.id).toEqual(userId.id);
    return server.close();
  });

  test('bootstrap fails quickly with bad user name', async () => {
    const { router, server } = createServer();
    await server.setup();
    // Signal test failure if we don't exit prior to these tripwires.
    server.authSession = undefined;
    server.authUser = undefined;
    const response = await request(router).get('/user/bootstrap/Pogo').
      set('x-access-token', 'badsecret');
    // Also, should get 403 rather than 440 if we caught the exception.
    expect(response.status).toEqual(403);
    expect(response.get('x-access-token')).not.toBeTruthy();
    return server.close();
  });

  test('serves event get requests', async () => {
    const { router, server } = createServer();
    const eventName = 'Kazoo Recital';
    const eventDescription = 'It\'s all the buzz';
    const tk = server.timekeeper;
    await server.setup();
    await tk.createEvent(eventName, 1, eventDescription);
    await tk.createEvent(`${eventName} again`, 1, `${eventDescription}, II`);

    const userId = await createUser(server, POGO_USER);
    const { id } = userId;
    const session = await bootstrap(router, userId);

    let response = await request(router).get(`/event/list/${id}`).
      set('x-access-token', session);
    expect(response.text).toEqual(JSON.stringify([1, 2]));
    response = await request(router).get(`/event/list/${id}`); // no secret
    expect(response.status).toEqual(401);
    response = await request(router).get(`/event/get/${id}/1`).
      set('x-access-token', session);
    expect(response.status).toEqual(200);
    const eventObj = JSON.parse(response.text);
    expect(eventObj.name).toEqual(eventName);
    expect(eventObj.description).toEqual(eventDescription);
    expect(eventObj.id).toEqual(1);

    response = await request(router).
      get(`/event/get/${id}/1`).
      set('x-access-token', 'bad-secret');
    expect(response.status).toEqual(403);
    response = await request(router).
      get(`/event/get/${id}/100`).
      set('x-access-token', session);
    expect(response.status, response.text).toEqual(404);

    response = await request(router).
      get(`/event/list/${id}/${JSON.stringify({ id: 1 })}`).
      set('x-access-token', session);
    expect(JSON.parse(response.text)).toEqual([1]);

    tk.getEvents = undefined;
    response = await request(router).
      get(`/event/list/${id}`).
      set('x-access-token', session);
    expect(response.status).toEqual(500);

    tk.getEvent = undefined;
    response = await request(router).
      get(`/event/list/${id}`).
      set('x-access-token', session);
    expect(response.status).toEqual(500);

    return server.close();
  });

  test('serves key-value lookup requests', async () => {
    const { router, server } = createServer();
    const tk = server.timekeeper;
    await server.setup();

    const userId = await createUser(server, POGO_USER);
    const { id } = userId;
    const session = await bootstrap(router, userId);

    // XXX TODO better encapsulate
    tk.getValue = async () => 'bar';

    const response = await request(router).get(`/key/${id}/foo`).
      set('x-access-token', session);
    expect(response.text).toEqual('bar');

    return server.close();
  });

  test('serves rsvp route', async () => {
    const { router, server } = createServer();
    const eventName = 'Kazoo Recital';
    const eventDescription = 'It\'s all the buzz';
    const tk = server.timekeeper;
    await server.setup();

    const userId = await createUser(server, POGO_USER);
    const { id } = userId;
    const session = await bootstrap(router, userId);

    await tk.createEvent(eventName, 1, eventDescription);
    await tk.createDateTime(1, '2012-01-01', '12:00', '20m');
    await tk.createDateTime(1, '2012-01-02', '12:00', '20m');

    let response = await request(router).
      get(`/event/rsvp/${id}/1/1/-1`).
      set('x-access-token', session);
    expect(response.status).toEqual(200);

    response = await request(router).
      get(`/event/rsvp/${id}/1/2/1`).
      set('x-access-token', session);
    expect(response.status).toEqual(200);

    response = await request(router).
      get(`/event/rsvp/${id}/1/2/1`).
      set('x-access-token', 'notsecret');
    expect(response.status).toEqual(403);

    response = await request(router).
      get(`/event/rsvp/${id}/1`).
      set('x-access-token', session);
    expect(response.text).toEqual(JSON.stringify({ 1: -1, 2: 1 }));

    response = await request(router).
      get(`/event/rsvp/${id}/1`).
      set('x-access-token', 'notsecret');
    expect(response.status).toEqual(403);

    tk.rsvp = undefined;
    response = await request(router).
      get(`/event/rsvp/${id}/1/2/1`).
      set('x-access-token', session);
    expect(response.status).toEqual(500);

    tk.getRsvps = undefined;
    response = await request(router).
      get(`/event/rsvp/${id}/1`).
      set('x-access-token', session);
    expect(response.status).toEqual(500);

    return server.close();
  });

  test('serves event summary', async () => {
    const { router, server } = createServer();
    const eventName = 'Kazoo Recital';
    const eventDescription = 'It\'s all the buzz';
    const tk = server.timekeeper;
    await server.setup();
    await tk.createEvent(eventName, 1, eventDescription);
    await tk.createDateTime(1, '2012-01-01', '12:00', '20m');
    await tk.createDateTime(1, '2012-01-02', '12:00', '20m');

    const pogoId = await createUser(server, POGO_USER);
    const pid = pogoId.id;
    const pogoSession = await bootstrap(router, pogoId);

    const churchyId = await createUser(server, CHURCHY_USER);
    const cid = churchyId.id;
    const churchySession = await bootstrap(router, churchyId);

    const beauregardId = await createUser(server, BEAUREGARD_USER);
    const bid = beauregardId.id;
    const beauregardSession = await bootstrap(router, beauregardId);

    await request(router).
      get(`/event/rsvp/${pid}/1/1/-1`).
      set('x-access-token', pogoSession);
    await request(router).
      get(`/event/rsvp/${pid}/1/2/1`).
      set('x-access-token', pogoSession);
    await request(router).
      get(`/event/rsvp/${cid}/1/1/1`).
      set('x-access-token', churchySession);
    await request(router).
      get(`/event/rsvp/${cid}/1/2/1`).
      set('x-access-token', churchySession);
    await request(router).
      get(`/event/rsvp/${bid}/1/1/1`).
      set('x-access-token', beauregardSession);
    await request(router).
      get(`/event/rsvp/${bid}/1/2/0`).
      set('x-access-token', beauregardSession);
    const result = await request(router).
      get(`/event/summary/${bid}/1`).
      set('x-access-token', beauregardSession);
    const expected = {
      1: { '-1': 1, 1: 2 },
      2: { 0: 1, 1: 2 },
    };
    expect(JSON.parse(result.text)).toEqual(expected);
    let response = await request(router).
      get(`/event/summary/${bid}/1`).
      set('x-access-token', 'notsecret');
    expect(response.status).toEqual(403);

    tk.summarizeRsvps = undefined;
    response = await request(router).
      get(`/event/summary/${bid}/1`).
      set('x-access-token', beauregardSession);
    expect(response.status).toEqual(500);

    return server.close();
  });

  test('joins user rsvp to event get requests', async () => {
    const { router, server } = createServer();
    const eventName = 'Kazoo Recital';
    const eventDescription = 'It\'s all the buzz';
    const tk = server.timekeeper;

    await server.setup();
    const userId = await createUser(server, POGO_USER);
    const session = await bootstrap(router, userId);

    await tk.createEvent(eventName, 1, eventDescription);
    await tk.createDateTime(1, '2018-12-01', '11:00', '15m');
    await tk.createDateTime(1, '2018-12-01', '13:00', '15m');
    await tk.rsvp(1, 1, 1, -1);
    await tk.rsvp(1, 1, 2, 1);

    let response = await request(router).
      get('/event/get/1/1').
      set('x-access-token', session);
    let eventObj = JSON.parse(response.text);
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

    await tk.closeEvent(1, 2);
    response = await request(router).get('/event/get/1/1').
      set('x-access-token', session);
    eventObj = JSON.parse(response.text);
    expect(eventObj.dateTime).toEqual({
      id: 2,
      event: 1,
      yyyymmdd: '2018-12-01',
      hhmm: '13:00',
      duration: '15m',
      attend: 1,
    });

    return server.close();
  });

  test('resets password', async () => {
    const { router, server } = createServer();
    let newPassword;
    server.auth.resetPassword = (userName) => {
      debug('resetting password mock', userName);
      newPassword = '1234';
    };

    await server.setup();
    const userId = await createUser(server, POGO_USER);
    const session = await bootstrap(router, userId);
    const response = await request(router).get(`/password/reset/${userId.name}`).
      set('x-access-token', session);
    expect(response.status).toBe(200);
    expect(response.text).toEqual('OK');
    expect(newPassword).toBeDefined();

    return server.close();
  });

  test('updates password', async () => {
    const { router, server } = createServer();
    await server.setup();

    const userId = await createUser(server, POGO_USER);
    const newPassword = `${userId.password}_updated_`;
    let session = await bootstrap(router, userId);
    const response = await request(router).
      get(`/password/change/${userId.id}/${newPassword}`).
      set('x-access-token', session);
    expect(response.status).toEqual(200);
    userId.password = newPassword;

    session = await bootstrap(router, userId);
    expect(session).toBeTruthy();
    return server.close();
  });

  test('serves event detail', async () => {
    const { router, server } = createServer();
    const eventName = 'Kazoo Recital';
    const eventDescription = 'It\'s all the buzz';
    const tk = server.timekeeper;
    await server.setup();

    const pogoId = await createUser(server, POGO_USER);
    const pid = pogoId.id;
    const psess = await bootstrap(router, pogoId);

    const churchyId = await createUser(server, CHURCHY_USER);
    const cid = churchyId.id;
    const csess = await bootstrap(router, churchyId);

    const beauId = await createUser(server, BEAUREGARD_USER);
    const bid = beauId.id;
    const bsess = await bootstrap(router, beauId);

    const event = await tk.createEvent(eventName, 1, eventDescription);
    await tk.createDateTime(event, '2012-01-01', '12:00', '20m');
    await tk.createDateTime(event, '2012-01-02', '12:00', '20m');

    await request(router).
      get(`/event/rsvp/${pid}/${event}/1/-1`).
      set('x-access-token', psess);
    await request(router).
      get(`/event/rsvp/${pid}/${event}/2/1`).
      set('x-access-token', psess);
    await request(router).
      get(`/event/rsvp/${cid}/${event}/1/1`).
      set('x-access-token', csess);
    await request(router).
      get(`/event/rsvp/${cid}/${event}/2/1`).
      set('x-access-token', csess);
    await request(router).
      get(`/event/rsvp/${bid}/${event}/1/1`).
      set('x-access-token', bsess);
    await request(router).
      get(`/event/rsvp/${bid}/${event}/2/0`).
      set('x-access-token', bsess);

    let response = await request(router).
      get(`/event/detail/${pid}/${event}`).
      set('x-access-token', psess);
    const expected = {
      1: { 1: -1, 2: 1, 3: 1 },
      2: { 1: 1, 2: 1, 3: 0 },
    };
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toEqual(expected);

    response = await request(router).
      get(`/event/detail/${pid}/${event}`).
      set('x-access-token', bsess);
    expect(response.status).toEqual(403);

    response = await request(router).
      get(`/event/detail/${bid}/${event}`).
      set('x-access-token', bsess);
    expect(JSON.parse(response.text)).toEqual({});

    return server.close();
  });

  test('serves get user', async () => {
    const { router, server } = createServer();
    const tk = server.timekeeper;
    await server.setup();
    const pogoId = await createUser(server, POGO_USER);
    const churchyId = await createUser(server, CHURCHY_USER);
    const beauregardId = await createUser(server, BEAUREGARD_USER);

    const pogoSession = await bootstrap(router, pogoId);
    const churchySession = await bootstrap(router, churchyId);

    let response = await request(router).
      get(`/user/get/${pogoId.id}/${churchyId.id}`).
      set('x-access-token', `${pogoSession}__`);
    // access-token must be valid session
    expect(response.status).toEqual(403);

    response = await request(router).
      get(`/user/id/${pogoId.id}/who`).
      set('x-access-token', `${pogoSession}__`);
    // access-token must be valid session
    expect(response.status).toEqual(403);

    response = await request(router).
      get(`/user/id/${pogoId.id}/mysteriousisoso`).
      set('x-access-token', pogoSession);
    expect(response.status).toEqual(404);

    response = await request(router).
      get(`/user/get/${pogoId.id}/${beauregardId.id}`).
      set('x-access-token', pogoSession);
    expect(JSON.parse(response.text)).toEqual({
      email: beauregardId.email,
      id: beauregardId.id,
      name: beauregardId.name,
      organizer: 0,
      section: '',
    });

    response = await request(router).
      get(`/user/get/${churchyId.id}/${churchyId.id}`).
      set('x-access-token', churchySession);
    expect(JSON.parse(response.text)).toEqual({
      email: churchyId.email,
      id: churchyId.id,
      name: churchyId.name,
      organizer: 0,
      section: churchyId.section,
    });

    response = await request(router).
      get(`/user/id/${churchyId.id}/${pogoId.name}`).
      set('x-access-token', churchySession);
    expect(response.text).toEqual(pogoId.id.toString());

    tk.getUserInfo = undefined;
    response = await request(router).
      get(`/user/get/${churchyId.id}/${churchyId.id}`).
      set('x-access-token', churchySession);
    expect(response.status).toEqual(500);

    tk.getUserId = undefined;
    response = await request(router).
      get(`/user/id/${churchyId.id}/${pogoId.name}`).
      set('x-access-token', churchySession);
    expect(response.status).toEqual(500);

    return server.close();
  });

  test('serves get venue', async () => {
    const { router, server } = createServer();
    const tk = server.timekeeper;
    await server.setup();
    const userId = await createUser(server, POGO_USER);
    const { id } = userId;
    await tk.createVenue('The Hollow', 'Right around the corner');
    await tk.createVenue('Shady Grove', 'Dunno');

    const session = await bootstrap(router, userId);
    let response = await request(router).get(`/venue/list/${id}`).
      set('x-access-token', session);
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
      set('x-access-token', session);
    debug('get venue: bad user id', response.text);
    expect(response.status).toEqual(403);

    response = await request(router).get(
      `/venue/list/${id}/${JSON.stringify({ name: 'Grove' })}`,
    ).
      set('x-access-token', session);
    expect(JSON.parse(response.text)).toEqual([
      {
        id: 2,
        name: 'Shady Grove',
        address: 'Dunno',
      },
    ]);

    response = await request(router).get(`/venue/get/${id}/1`).
      set('x-access-token', session);
    expect(JSON.parse(response.text)).toEqual(
      {
        id: 1,
        name: 'The Hollow',
        address: 'Right around the corner',
      },
    );

    response = await request(router).get(`/venue/get/${id}/1`).
      set('x-access-token', 'notsecret');
    expect(response.status).toEqual(403);

    response = await request(router).get(`/venue/get/${id}/3`).
      set('x-access-token', session);
    expect(response.status).toEqual(404);

    tk.getVenues = undefined;
    response = await request(router).get(`/venue/get/${id}/3`).
      set('x-access-token', session);
    expect(response.status).toEqual(500);

    response = await request(router).get(`/venue/list/${id}`).
      set('x-access-token', session);
    expect(response.status).toEqual(500);

    return server.close();
  });

  test('serves datetime get', async () => {
    const { router, server } = createServer();
    await server.setup();
    const tk = server.timekeeper;

    const userId = await createUser(server, POGO_USER);
    const { id } = userId;
    const session = await bootstrap(router, userId);

    await tk.createDateTime(7, '2018-12-01', '10:00', '5m');
    await tk.createDateTime(3, '2018-12-01', '10:00', '5m');
    await tk.createDateTime(7, '2018-12-02', '10:15', '5m');
    await tk.createDateTime(7, '2018-12-03', '10:20', '5m');

    let response = await request(router).
      get('/datetime/get/{id+3}/7').
      set('x-access-token', session);
    expect(response.status).toEqual(403);

    response = await request(router).
      get(`/datetime/get/${id}/4`).
      set('x-access-token', session);
    expect(JSON.parse(response.text)).toEqual(
      {
        id: 4, event: 7, yyyymmdd: '2018-12-03', hhmm: '10:20', duration: '5m',
      },
    );

    tk.getDatetime = undefined;
    response = await request(router).
      get(`/datetime/get/${id}/4`).
      set('x-access-token', session);
    expect(response.status).toEqual(500);
    return server.close();
  });

  test('serves never attend dates', async () => {
    const { router, server } = createServer();
    await server.setup();
    const userId = await createUser(server, POGO_USER);
    const { id } = userId;
    const session = await bootstrap(router, userId);

    let result = await request(router).get(`/event/nevers/${id}`).
      set('x-access-token', session);
    expect(result.status).toEqual(200);
    expect(result.text).toEqual('[]');
    await request(router).get(`/event/never/${id}/2999-12-31`).
      set('x-access-token', session);
    await request(router).get(`/event/never/${id}/2999-12-30`).
      set('x-access-token', session);
    await request(router).get(`/event/never/${id}/1999-12-31`).
      set('x-access-token', session);
    result = await request(router).get(`/event/nevers/${id}`).
      set('x-access-token', session);
    expect(result.status).toEqual(200);
    expect(JSON.parse(result.text)).toEqual(['2999-12-30', '2999-12-31']);

    result = await request(router).get(`/event/nevers/${id}`).
      set('x-access-token', 'Secret');
    expect(result.status).toEqual(403);

    result = await request(router).get(`/event/never/${id}/2018-12-01`).
      set('x-access-token', 'Secret');
    expect(result.status).toEqual(403);

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

  test('updates user section', async () => {
    const { router, server } = createServer();
    const tk = server.timekeeper;
    await server.setup();
    const userId = await createUser(server, POGO_USER);
    const session = await bootstrap(router, userId);

    let result = await request(router).get('/user/update-section/1/opossum').
      set('x-access-token', session);
    expect(result.text).toEqual(userId.section);

    await tk.db.runAsync('INSERT INTO sections(name) VALUES (\'opossum\')');
    result = await request(router).get('/user/update-section/1/opossum').
      set('x-access-token', session);
    expect(result.text).toEqual('opossum');

    result = await request(router).get('/user/update-section/1/opossum').
      set('x-access-token', 'seeeecret');
    expect(result.status).toEqual(403);

    return server.close();
  });
});

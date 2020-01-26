const debug = require('debug')('participantCreator:test');
const path = require('path');
const ParticipantCreator = require('../../src/admin/participantCreator.js');

const scriptName = path.basename(__filename);
const pcConfig = {
  authDbFileName: ':memory:',
  catWranglerDbFileName: ':memory:',
};

describe('Create Participant administration', () => {
  test('Parses command-line arguments', async () => {
    const cli = ['node', scriptName, '-n', 'Alice', '--password', 'hush', '-e', 'alice@wonder.land'];
    const userConfig = ParticipantCreator.parseCLI(cli);
    debug('Parses command line', userConfig);
    expect(userConfig.name).toEqual(cli[3]);
    expect(userConfig.password).toEqual(cli[5]);
    expect(userConfig.email).toEqual(cli[7]);
    expect(userConfig.section).toBeUndefined();
    expect(userConfig.organizer).toBeUndefined();
  });

  test('Creates a user', async () => {
    const cli = ['node', scriptName, '-n', 'Alice', '--password', 'hush', '-e', 'alice@wonder.land'];
    const userConfig = ParticipantCreator.parseCLI(cli);
    const pc = new ParticipantCreator(pcConfig);
    await pc.setup();
    const userInfo = await pc.createParticipant(userConfig);
    debug('Creates a user', userInfo);
    expect(userInfo.id).toBeDefined();
    expect(userInfo.name).toEqual(cli[3]);
    expect(userInfo.email).toEqual(cli[7]);
    return pc.close();
  });

  test('Imports a user', async () => {
    const pc = new ParticipantCreator(pcConfig);
    await pc.setup();

    const cli = ['node', scriptName, '-i', '9999'];
    const authInfo = {
      id: cli[3],
      name: 'Alice',
      email: 'alice@wonder.land',
      password: 'hush',
    };
    debug('Auth', authInfo);
    await pc.server.auth.createUser(authInfo);

    const userConfig = ParticipantCreator.parseCLI(cli);
    const userInfo = await pc.createParticipant(userConfig);
    debug('Imports a user', userInfo);
    expect(userInfo).toBeDefined();
    expect(userInfo.id && userInfo.id.toString()).toEqual(authInfo.id);
    expect(userInfo.name).toEqual(authInfo.name);
    expect(userInfo.email).toEqual(authInfo.email);

    return pc.close();
  });

  test('Import user with id collision from auth', async () => {
    const pc = new ParticipantCreator(pcConfig);
    await pc.setup();

    const cli = ['node', scriptName, '-n', 'Alice', '--password', 'sssh', '-e', 'alice@wonder.land'];
    const userInfo = {
      id: '1',
      name: 'Bob',
      email: 'bob@bob.ie',
      password: 'ssh',
    };
    await pc.server.auth.createUser(userInfo);

    const userConfig = ParticipantCreator.parseCLI(cli);
    let error;
    try {
      await pc.createParticipant(userConfig);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    debug('collision from auth', error.message);
    expect(error.message.includes('constraint failed')).toBe(true);

    const cleanup = await pc.server.timekeeper.getUserInfo(1);
    expect(cleanup).toBeUndefined();
    return pc.close();
  });

  test('Import user with id collision from timekeeper', async () => {
    const pc = new ParticipantCreator(pcConfig);
    await pc.setup();

    const cli = ['node', scriptName, '-i', '9999'];
    const authInfo = {
      id: cli[3],
      name: 'Alice',
      email: 'alice@wonder.land',
      password: 'hush',
    };
    debug('Auth', authInfo);
    await pc.server.auth.createUser(authInfo);
    const userInfo = {
      id: cli[3],
      name: 'Bob',
      email: 'bob@bob.ie',
      password: 'ssh',
    };
    await pc.server.timekeeper.createParticipant(userInfo.name, userInfo);

    const userConfig = ParticipantCreator.parseCLI(cli);
    let error;
    await pc.createParticipant(userConfig).
      catch((e) => {
        error = e;
      });
    expect(error).toBeDefined();
    expect(error.message.includes('UNIQUE constraint failed: participants.rowid')).toBe(true);
    return pc.close();
  });
});

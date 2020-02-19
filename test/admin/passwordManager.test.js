const path = require('path');
const ParticipantCreator = require('../../src/admin/participantCreator');
const PasswordManager = require('../../src/admin/passwordManager');

const scriptName = path.basename(__filename);
const pmConfig = {
  authDbFileName: ':memory:',
  catWranglerDbFileName: ':memory:',
  privateKeyFileName: 'test/server/jwtRS256.key',
  publicKeyFileName: 'test/server/jwtRS256.key.pub',
};

describe('Password administration', () => {
  test('Requires email, id, or name', () => {
    const cli = ['node', scriptName];
    expect(() => PasswordManager.parseCLI(cli)).
      toThrowError(/requires either id, name, or email/);
  });

  test('Requires password or recovery', () => {
    const cli = ['node', scriptName, '-n', 'Alice'];
    expect(() => PasswordManager.parseCLI(cli)).
      toThrowError(/requires either new or recovery password/);
  });

  test('Resets a password', async () => {
    const pm = new PasswordManager(pmConfig);
    const pc = new ParticipantCreator(pmConfig);
    await pm.setup();
    pc.server = pm.server;

    const userInfo = await pc.createParticipant({
      email: 'alice@wonder.land',
      name: 'Alice',
      password: 'ssh',
    });
    let testAuth = await pm.server.authUser(userInfo.id, 'ssh');
    expect(testAuth.session).toBeTruthy();

    const cli = ['node', scriptName, '-i', userInfo.id, '-p', 'hush'];
    const opts = PasswordManager.parseCLI(cli);
    await pm.managePassword(opts);
    testAuth = await pm.server.authUser(userInfo.id, 'ssh');
    expect(testAuth.session).not.toBeTruthy();

    testAuth = await pm.server.authUser(userInfo.id, 'hush');
    expect(testAuth.session).toBeTruthy();

    return pm.close();
  });

  test('Sets a recovery password', async () => {
    const pm = new PasswordManager(pmConfig);
    const pc = new ParticipantCreator(pmConfig);
    await pm.setup();
    pc.server = pm.server;

    const userInfo = await pc.createParticipant({
      email: 'alice@wonder.land',
      name: 'Alice',
      password: 'ssh',
    });
    let testAuth = await pm.server.authUser(userInfo.id, 'ssh');
    expect(testAuth.session).toBeTruthy();

    const cli = ['node', scriptName, '-i', userInfo.id, '-r', 'hush'];
    const opts = PasswordManager.parseCLI(cli);
    await pm.managePassword(opts);

    testAuth = await pm.server.authUser(userInfo.id, 'ssh');
    expect(testAuth.session).toBeTruthy();

    testAuth = await pm.server.authUser(userInfo.id, 'hush');
    expect(testAuth.session).toBeTruthy();

    testAuth = await pm.server.authUser(userInfo.id, 'ssh');
    expect(testAuth.session).not.toBeTruthy();

    return pm.close();
  });
});

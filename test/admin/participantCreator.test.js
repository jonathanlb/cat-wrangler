const path = require('path');
const ParticipantCreator = require('../../src/admin/participantCreator.js');

const scriptName = path.basename(__filename);
const pcConfig = {
  authDbFileName: ':memory',
  catWranglerDbFileName: ':memory:'
};

describe('Create Participant administration', () => {
  test('Parses command-line arguments', async () => {
    const cli = ['node', scriptName, '-n', 'Alice', '--password', 'hush', '-e', 'alice@wonder.land'];
    const userConfig = ParticipantCreator.parseCLI(cli);
    expect(userConfig.username).toEqual(opts[3]);
    expect(userConfig.password).toEqual(opts[5]);
    expect(userConfig.email).toEqual(opts[7]);
    expect(userConfig.section).toBeUndefined();
    expect(userConfig.organizer).toBeUndefined();
  });

  test('Create user', async () => {
    const cli = ['node', scriptName, '-n', 'Alice', '--password', 'hush', '-e', 'alice@wonder.land'];
    const userConfig = ParticipantCreator.parseCLI(cli);
    const pc = new ParticipantCreator(pcConfig);
    await pc.setup();
    const userInfo = await pc.createParticipant(userConfig);
    return pc.close();
  });

  test('Import user', async () => {
    const cli = ['node', scriptName, '-n', 'Alice', '--password', 'hush', '-e', 'alice@wonder.land', '-i', '9999'];
    const userConfig = ParticipantCreator.parseCLI(opts);
    const pc = new ParticipantCreator(pcConfig);
    await pc.setup();
    const userInfo = await pc.createParticipant(userConfig);
    return pc.close();
  });

});

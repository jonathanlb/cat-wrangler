const EventCreator = require('../../src/admin/eventCreator');

const eventConfigFile = 'test/admin/testEvent.json';

describe('Create Event administration', () => {
  test('Reads event config', () => EventCreator.parseEventConfig(eventConfigFile).
    then((eventConfig) => {
      expect(eventConfig.name).toEqual('Extravaganza');
      expect(eventConfig.dates).toHaveLength(2);
    }));

  test('Creates event', async () => {
    const eventConfig = await EventCreator.parseEventConfig(eventConfigFile);
    const serverConfig = {
      auth: {
        method: 'simple-auth',
        dbFileName: ':memory:',
      },
      sqliteTimekeeper: {
        file: ':memory:',
      },
    };

    const ec = new EventCreator(serverConfig);
    await ec.run(eventConfig);
    const eventIds = await ec.server.timekeeper.getEvents();
    expect(eventIds).toHaveLength(1);
    const eventInfo = await ec.server.timekeeper.getEvent(eventIds[0]);
    expect(eventInfo.name).toEqual('Extravaganza');
    return ec.close();
  });
});

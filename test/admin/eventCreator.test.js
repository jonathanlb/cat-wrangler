const EventCreator = require('../../src/admin/eventCreator');

const eventConfigFile = 'test/admin/testEvent.json';

describe('Create Event administration', () => {
  test('Reads event config', () => EventCreator.parseEventConfig(eventConfigFile).
    then((eventConfig) => {
      expect(eventConfig.name).toEqual('Extravaganza');
      expect(eventConfig.dates).toHaveLength(2);
    }));

  test('Evergreen, in-memory', () => EventCreator.parseEventConfig(eventConfigFile).
    then((eventConfig) => {
      const serverConfig = {
        sqliteTimekeeper: {
          file: ':memory:',
        },
      };

      const ec = new EventCreator(serverConfig);
      return ec.run(eventConfig).
        then(() => ec.close());
    }));
});

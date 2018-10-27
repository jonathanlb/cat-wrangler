const EventCreator = require('../../src/admin/eventCreator');
const eventConfigFile = 'test/admin/testEvent.json';

describe('Create Event administration', () => {
  test('Reads event config', () => {
    return EventCreator.parseEventConfig(eventConfigFile).
      then((eventConfig) => {
        expect(eventConfig.name).toEqual('Extravaganza');
        expect(eventConfig.dates.length).toEqual(2);
      });
  });

  test('Evergreen, in-memory', () => {
    return EventCreator.parseEventConfig(eventConfigFile).
      then((eventConfig) => {
        const serverConfig = {
          sqliteTimekeeper: {
            file: ':memory:',
          },
        };

        const ec = new EventCreator(serverConfig);
        return ec.run(eventConfig).
          then(() => ec.close());
      });
  });
});

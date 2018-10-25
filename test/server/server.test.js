const Server = require('../../src/server/server');

describe('Server routing tests', () => {
  test('has default instantiation', () => {
    const server = new Server({});
    expect(server.timekeeper).toBeDefined();
    server.setup();
  });
});

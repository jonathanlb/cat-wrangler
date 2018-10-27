const express = require('express');
const Server = require('../../src/server/server');

describe('Server routing tests', () => {
  test('has default instantiation', () => {
    const router = express();
    const server = new Server({ router });
    expect(server.timekeeper).toBeDefined();
    return server.setup().
      then(result => expect(result).toBe(server));
  });
});

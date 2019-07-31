const basicAuthF = require('../../src/client/basicAuth');

global.fetch = require('jest-fetch-mock');

describe('Basic Authentication', () => {
  test('Alerts user to failure', async () => {
    let errorMsg;
    let opened;
    const basicAuth = basicAuthF({
      serverPrefix: 'https://theServer.org',
      userId: 19,
    });

    global.window = {
      alert: (msg) => { errorMsg = msg; },
      open: (url) => { opened = url; },
    };
    global.fetch.mockResponseOnce('', {
      status: 400,
    });
    const key = 'foo';
    const url = 'some.server.org';

    await basicAuth.openContent(key, url);
    expect(errorMsg).toEqual('Cannot authenticate with content server.');
    expect(opened).toBeUndefined();
  });

  test('Requires https', async () => {
    let errorMsg;
    let opened;
    const key = 'foo';
    const url = 'some.server.org';
    const basicAuth = basicAuthF({
      serverPrefix: 'http://theServer.org',
      userId: 19,
    });

    global.window = {
      open: (openUrl) => { opened = openUrl; },
      alert: (msg) => { errorMsg = msg; },
    };
    global.fetch.mockResponseOnce('frodo:ring');

    await basicAuth.openContent(key, url);
    expect(errorMsg).toEqual('Cannot authenticate with content server.');
    expect(opened).toBeUndefined();
  });

  test('Retrieves content', async () => {
    let errorMsg;
    let opened;
    const basicAuth = basicAuthF({
      serverPrefix: 'https://theServer.org',
      userId: 19,
    });

    global.window = {
      alert: (msg) => { errorMsg = msg; },
      location: {},
      navigator: {
        userAgent: 'Chrome',
      },
      open: (url) => { opened = url; },
    };
    global.fetch.mockResponseOnce('frodo:ring');
    const key = 'foo';
    const url = 'some.server.org';
    await basicAuth.openContent(key, url);
    expect(opened).toEqual(`https://frodo:ring@${url}`);
    expect(window.location.href).toEqual(`https://frodo:ring@${url}`);
    // We don't mock popups...
    expect(errorMsg).toEqual('Please add this site to your popup blocker exception list.');
  });

  test('Retrieves content with MS Edge', async () => {
    let errorMsg;
    let opened;
    const basicAuth = basicAuthF({
      serverPrefix: 'https://theServer.org',
      userId: 19,
    });

    global.window = {
      alert: (msg) => { errorMsg = msg; },
      location: {},
      navigator: {
        userAgent: 'Edge/12.3456',
      },
      open: (url) => { opened = url; },
    };
    global.fetch.mockResponseOnce('frodo:ring');
    const key = 'foo';
    const url = 'some.server.org';
    await basicAuth.openContent(key, url);
    expect(opened).toEqual(`https://${url}`);
    expect(window.location.href).toEqual(`https://${url}`);
    // We don't mock popups...
    expect(errorMsg).toEqual('Please add this site to your popup blocker exception list.');
  });
});

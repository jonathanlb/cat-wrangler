/**
 * @jest-environment jsdom
 */

global.fetch = require('jest-fetch-mock');

const about = require('../../src/client/views/about');

describe('About app component', () => {
  test('renders', async () => {
    const content = '<h1>Hello!</h1>';
    global.fetch.mockResponseOnce(content);
    const app = { serverPrefix: './ignored' };
    const testOpts = {};

    document.body.innerHTML = '';
    document.body.appendChild(
      about(app, testOpts),
    );

    await testOpts.fetchPromise;
    expect(document.body.innerHTML.includes(content)).toBe(true);
  });

  test('ignores test switch', async () => {
    const content = '<h1>Hello!</h1>';
    global.fetch.mockResponseOnce(content);
    const app = { serverPrefix: './ignored' };
    document.body.innerHTML = '';
    document.body.appendChild(about(app));
  });

  test('renders on error', async () => {
    global.fetch.mockImplementationOnce(
      () => Promise.reject(new Error('???')),
    );
    const app = { serverPrefix: './ignored' };
    const testOpts = {};

    document.body.innerHTML = '';
    document.body.appendChild(
      about(app, testOpts),
    );

    await testOpts.fetchPromise;
    expect(document.body.innerHTML.includes('Cannot connect')).toBe(true);
  });
});

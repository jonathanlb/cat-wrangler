/**
 * @jest-environment jsdom
 */

const App = require('../../src/client/app');

function setUpDocument() {
  const contentDiv = 'main-app';
  document.body.innerHTML = `\
    <div>\
      <h1>Test Content</h1>\
      <div id="${contentDiv}">\
        uninitialized\
      </div>\
    </div>\
  `;

  return {
    contentDiv,
  };
}

describe('Application framework', () => {
  test('Defaults to login view', () => {
    const app = new App(setUpDocument());
    app.setup().
      then(() => {
        app.render();

        expect(app.isReady(), 'App initializes without username, etc.').
          toBe(false);
        expect(document.body.innerHTML.includes('Password:'), 'App prompts for password').
          toBe(true);
      });
  });
});

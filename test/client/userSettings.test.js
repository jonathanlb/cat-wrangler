/**
 * @jest-environment jsdom
 */

const MutationObserver = require('mutation-observer');
const yo = require('yo-yo');

const userSettings = require('../../src/client/views/userSettings');
const Views = require('../../src/client/views');

function setUpDocument(app, f) {
  document.body.innerHTML = `<div id="${app.contentDiv}"></div>`;
  yo.update(document.getElementById(app.contentDiv),
    yo`<div id="${app.contentDiv}">${f()}</div>`);
}

describe('User settings component', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'MutationObserver', { value: MutationObserver });
  });

  test('renders', () => {
    const app = {
      contentDiv: 'main-app',
      getNevers: async () => [],
      render: () => undefined,
      updateSection: () => undefined,
      userName: 'Bilbo',
      userSection: 'hobbit',
    };

    setUpDocument(app, () => userSettings(app));
    expect(document.body.innerHTML.includes('Blackout Dates')).toBe(true);
  });

  test('updates section', async () => {
    const app = {
      contentDiv: 'main-app',
      getNevers: async () => [],
      render: () => undefined,
      updateSection: async (newSection) => newSection.toLowerCase(),
      userName: 'Bilbo',
      userSection: 'hobbit',
    };

    setUpDocument(app, () => userSettings(app));
    const sectionInput = document.getElementById('sectionText');
    sectionInput.value = 'Imaginary Person';
    await sectionInput.onkeyup({ key: 'Enter' });
    expect(sectionInput.value).toEqual('imaginary person');
  });

  test('preps update password', () => {
    let view = 0;
    const app = {
      contentDiv: 'main-app',
      getNevers: async () => [],
      render: (opts) => {
        view = opts.view; // eslint-disable-line prefer-destructuring
        return view;
      },
      updateSection: () => undefined,
      userName: 'Bilbo',
      userSection: 'hobbit',
    };

    setUpDocument(app, () => userSettings(app));
    const button = document.getElementById('changePasswordButton');
    button.onclick();
    expect(view).toEqual(Views.UPDATE_PASSWORD);
  });
});

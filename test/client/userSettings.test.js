/**
 * @jest-environment jsdom
 */

const userSettings = require('../../src/client/views/userSettings');
const Views = require('../../src/client/views');

describe('User settings component', () => {
  test('renders', () => {
    const app = {
      getNevers: async () => [],
      render: () => undefined,
      updateSection: () => undefined,
      userName: 'Bilbo',
      userSection: 'hobbit',
    };

    document.body.innerHTML = '';
    document.body.appendChild(userSettings(app));
    expect(document.body.innerHTML.includes('Blackout Dates')).toBe(true);
  });

  test('updates section', async () => {
    const app = {
      getNevers: async () => [],
      render: () => undefined,
      updateSection: async newSection => newSection.toLowerCase(),
      userName: 'Bilbo',
      userSection: 'hobbit',
    };

    document.body.innerHTML = '';
    document.body.appendChild(userSettings(app));
    const sectionInput = document.getElementById('sectionText');
    sectionInput.value = 'Imaginary Person';
    await sectionInput.onkeyup({ key: 'Enter' });
    expect(sectionInput.value).toEqual('imaginary person');
  });

  test('preps update password', () => {
    let view = 0;
    const app = {
      getNevers: async () => [],
      render: (opts) => {
        view = opts.view; // eslint-disable-line prefer-destructuring
        return view;
      },
      updateSection: () => undefined,
      userName: 'Bilbo',
      userSection: 'hobbit',
    };

    document.body.innerHTML = '';
    document.body.appendChild(userSettings(app));
    const button = document.getElementById('changePasswordButton');
    button.onclick();
    expect(view).toEqual(Views.UPDATE_PASSWORD);
  });
});

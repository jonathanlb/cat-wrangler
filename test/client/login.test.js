/**
 * @jest-environment jsdom
 */
const login = require('../../src/client/views/login');

describe('Login component', () => {
  beforeAll(() => {
    // eslint-disable-next-line no-console
    window.alert = console.log;
  });

  test('ignores empty user name and password', () => {
    let userNameEntered;
    let passwordEntered;

    const app = {
      setUserNameAndPassword: (u, p) => {
        userNameEntered = u;
        passwordEntered = p;
      },
    };
    const elt = login(app);
    document.body.innerHTML = elt.innerHTML;

    const button = Array.from(elt.children).find(e => e.textContent === 'OK');
    button.click();
    expect(userNameEntered).toBeUndefined();

    const userNameField = Array.from(elt.children).
      find(e => e.id === 'userNameField');
    userNameField.value = 'Bob';
    button.click();
    expect(userNameEntered).toBeUndefined();
    expect(passwordEntered).toBeUndefined();
  });

  test('renders', () => {
    const app = {};
    const elt = login(app);
    expect(elt.innerHTML.includes('User name:'), 'Contains username label').
      toBe(true);
    expect(elt.innerHTML.includes('Password:'), 'Contains password label').
      toBe(true);
  });

  test('sets user name and password', async () => {
    let userNameEntered; let
      passwordEntered;

    const app = {
      setUserNameAndPassword: async (u, p) => {
        userNameEntered = u;
        passwordEntered = p;
      },
    };
    const elt = login(app);
    document.body.innerHTML = '';
    document.body.appendChild(elt);

    const userNameField = document.getElementById('userNameField');
    userNameField.value = 'Bob ';
    userNameField.onkeyup({ key: ' ' });
    userNameField.onkeyup({ key: 'Tab' });
    expect(document.activeElement.id).toEqual('passwordField');

    userNameField.focus();
    userNameField.onkeyup({ key: 'Enter' });
    expect(document.activeElement.id).toEqual('passwordField');

    const passwordField = document.getElementById('passwordField');
    passwordField.value = 'secret';
    passwordField.onkeyup({ key: 'Enter' });

    const button = Array.from(elt.children).find(e => e.textContent === 'OK');
    button.click();

    expect(userNameEntered).toEqual('Bob');
    expect(passwordEntered).toEqual('secret');
    expect(passwordField.value).toEqual('');
  });

  test('resetPassword', async () => {
    let alertCount = 0;
    let resetCount = 0;
    const app = {
      resetPassword: async () => { resetCount += 1; },
    };
    const elt = login(app);
    document.body.innerHTML = '';
    document.body.appendChild(elt);
    window.confirm = () => false;
    window.alert = () => { alertCount += 1; };
    const button = document.getElementById('resetPasswordButton');

    // Ensure we only reset with a name entered.
    await button.onclick();
    expect(resetCount).toEqual(0);
    expect(alertCount).toEqual(1);

    // Enter the name, but still keep confirmation negative.
    const nameField = document.getElementById('userNameField');
    nameField.value = 'Bilbo';
    await button.onclick();
    expect(resetCount).toEqual(0);
    expect(alertCount).toEqual(1);

    // Confirm
    window.confirm = () => true;
    await button.onclick();
    expect(resetCount).toEqual(1);
  });
});

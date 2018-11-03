/**
 * @jest-environment jsdom
 */
const login = require('../../src/client/views/login');

describe('Login component', () => {
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

  test('sets user name and password', () => {
    let userNameEntered; let
      passwordEntered;

    const app = {
      setUserNameAndPassword: (u, p) => {
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
});

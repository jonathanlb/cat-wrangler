/**
 * @jest-environment jsdom
 */

const updatePassword = require('../../src/client/views/updatePassword');
const Views = require('../../src/client/views');

describe('Update password component', () => {
  test('renders', () => {
    const app = {
      render: () => undefined,
      updatePassword: () => undefined,
    };

    document.body.innerHTML = '';
    document.body.appendChild(updatePassword(app));
    expect(document.body.innerHTML.includes('Verify new password')).toBe(true);
  });

  test('cancels update request', () => {
    let view = 0;
    const app = {
      render: (renderOpts) => {
        view = renderOpts.view; // eslint-disable-line prefer-destructuring
        return view;
      },
      updatePassword: () => undefined,
    };

    document.body.innerHTML = '';
    document.body.appendChild(updatePassword(app));
    const button = document.getElementById('cancelChangePasswordButton');
    button.onclick();
    expect(view).toEqual(Views.USER_SETTINGS);
  });

  test('updates password', async () => {
    let view = 0;
    let password = '';
    let alertCount = 0;
    window.alert = () => { alertCount += 1; };

    const app = {
      render: (renderOpts) => {
        view = renderOpts.view; // eslint-disable-line prefer-destructuring
        return view;
      },
      updatePassword: async (newPassword) => {
        password = newPassword;
      },
    };

    document.body.innerHTML = '';
    document.body.appendChild(updatePassword(app));
    const button = document.getElementById('changePasswordButton');
    const passField = document.getElementById('passwordChange0');
    const verifyField = document.getElementById('passwordChange1');

    passField.value = 'foo';
    verifyField.value = 'bar';
    button.onclick();
    expect(alertCount).toEqual(1);
    expect(view).toEqual(0);

    passField.value = 'foobar';
    verifyField.value = 'foobar';
    await button.onclick();
    expect(password).toEqual('foobar');
    expect(view).toEqual(Views.USER_SETTINGS);
  });
});

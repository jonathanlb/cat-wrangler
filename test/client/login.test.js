/**
 * @jest-environment jsdom
 */
const login = require('../../src/client/views/login');

describe('Login component', () => {
  test('renders', () => {
    const app = {};
    const elt = login(app);
    expect(elt.innerHTML.includes('User name:'), 'Contains username label').
      toBe(true);
    expect(elt.innerHTML.includes('Password:'), 'Contains password label').
      toBe(true);
  });
});

/**
 * @jest-environment jsdom
 */

const neverDates = require('../../src/client/views/neverDates');

describe('Never dates component', () => {
  test('renders', async () => {
    const testOpts = {};
    const app = {
      getNevers: async () => [],
    };

    document.body.innerHTML = '';
    document.body.appendChild(
      neverDates(app, testOpts),
    );
    await testOpts.neversPromise;
    expect(document.body.innerHTML.includes('No dates entered.')).toBe(true);
  });

  test('ignores test code', () => {
    const app = {
      getNevers: async () => [],
    };

    document.body.innerHTML = '';
    document.body.appendChild(neverDates(app));
  });

  test('renders dates', async () => {
    const testOpts = {};
    const app = {
      getNevers: async () => ['2018-12-01', '2018-12-02'],
    };

    document.body.innerHTML = '';
    document.body.appendChild(
      neverDates(app, testOpts),
    );
    await testOpts.neversPromise;
    expect(document.body.innerHTML.includes('Sat, Dec 1, 2018')).toBe(true);
  });

  test('submits never-attend dates', async () => {
    const testOpts = {};
    let neverDate = '';
    const app = {
      getNevers: async () => ['2018-12-01', '2018-12-02'],
      postNevers: async (dateStr) => { neverDate = dateStr; },
    };

    document.body.innerHTML = '';
    document.body.appendChild(
      neverDates(app, testOpts),
    );
    await testOpts.neversPromise;
    const button = document.getElementById('neverSubmit');
    const datePicker = document.getElementById('neverPicker');
    datePicker.value = '01/30/2019';
    await button.onclick();
    expect(neverDate).toEqual('01/30/2019');
  });
});

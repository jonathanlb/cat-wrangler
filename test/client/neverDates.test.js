/**
 * @jest-environment jsdom
 */

const MutationObserver = require('mutation-observer');
const yo = require('yo-yo');

const neverDates = require('../../src/client/views/neverDates');

function setUpDocument(app, f) {
  document.body.innerHTML = `<div id="${app.contentDiv}"></div>`;
  yo.update(document.getElementById(app.contentDiv),
    yo`<div id="${app.contentDiv}">${f()}</div>`);
}

describe('Never dates component', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'MutationObserver', { value: MutationObserver });
  });

  test('renders', async () => {
    const testOpts = {};
    const app = {
      contentDiv: 'main-app',
      getNevers: async () => [],
    };
    setUpDocument(app, () => neverDates(app, testOpts));

    await testOpts.neversPromise;
    expect(document.body.innerHTML.includes('No dates entered.')).toBe(true);
  });

  test('ignores test code', () => {
    const app = {
      getNevers: async () => [],
    };

    setUpDocument(app, () => neverDates(app));
  });

  test('renders dates', async () => {
    const testOpts = {};
    const app = {
      getNevers: async () => ['2018-12-01', '2018-12-02'],
    };
    setUpDocument(app, () => neverDates(app, testOpts));

    await testOpts.neversPromise;
    expect(document.body.innerHTML.includes('Sat, Dec 1, 2018')).toBe(true);
  });

  test('submits never-attend dates', async () => {
    const testOpts = {};
    let neverDate = '';
    const app = {
      getNevers: async () => ['2018-12-01', '2018-12-02'],
      postNevers: async (dateStr) => {
        neverDate = dateStr;
      },
    };
    setUpDocument(app, () => neverDates(app, testOpts));

    await testOpts.neversPromise;
    const button = document.getElementById('neverSubmit');
    const datePicker = document.getElementById('neverPicker');
    datePicker.value = '2019-01-30';
    await button.onclick();
    expect(neverDate).toEqual('2019-01-30');
  });
});

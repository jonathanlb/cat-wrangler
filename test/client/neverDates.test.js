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
  });

  test('ignores test code', () => {
    const app = {
      getNevers: async () => [],
    };

    setUpDocument(app, () => neverDates(app));
  });

  test('renders dates', async () => {
    const testOpts = {};
    let neverDate = '';
    const app = {
      getNevers: async () => ['3018-12-01', '3018-12-02'],
      postNevers: async (dateStr) => {
        neverDate = dateStr;
      },
    };
    setUpDocument(app, () => neverDates(app, testOpts));

    testOpts.installDatePicker();
    const date = new Date(3018, 11, 15);
    testOpts.datepicker.onSelect(null, date);
    await testOpts.neversPromise;
    // how to query testOpts.dateSelected for other dates?
    expect(testOpts.dateSelected.dateSelected).toEqual(date);
    expect(neverDate).toEqual('3018-12-15');
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

    testOpts.installDatePicker();
    await testOpts.neversPromise;
    const date = new Date(); // get local timezone....
    date.setYear(2019);
    date.setMonth(0);
    date.setDate(30);
    testOpts.datepicker.onSelect(undefined, date);
    expect(neverDate).toEqual('2019-01-30');
  });
});

/**
 * @jest-environment jsdom
 */

const debug = require('debug')('details');
const detailEvent = require('../../src/client/views/detailEvent');

const userInfo = {
  1: {
    id: 1,
    name: 'Bilbo',
    section: 'Hobbit',
  },
  2: {
    id: 2,
    name: 'Frodo',
    section: 'Hobbit',
  },
  3: {
    id: 3,
    name: 'Gandolf',
    section: 'Wizard',
  },
  4: {
    id: 4,
    name: 'Smaug',
    section: 'Dragon',
  },
};

function createAppElt() {
  const details = {
    21: {
      1: 1, 2: 0, 3: -1, 4: 0,
    },
    22: { },
  };
  const app = {
    getEventDetails: async () => details,
    getUserInfo: async id => userInfo[id],
  };
  const viewOpts = {
    event: {
      id: 1,
      name: 'Testing Huzzah',
    },
    dt: {
      id: 21,
      yyyymmdd: '20181225',
      hhmm: '1300',
      duration: '120m',
    },
  };

  const elt = detailEvent(app, viewOpts);
  document.body.innerHTML = '';
  document.body.append(elt);
  return elt;
}

describe('Event detail component', () => {
  test('renders', () => {
    let elt = createAppElt();
    debug('renders', document.body.innerHTML);

    // check Roll Call button is active
    let detailsTabs = document.getElementsByClassName(
      'details-tabs tablink',
    );
    expect(detailsTabs).toHaveLength(3);
    detailsTabs = document.getElementsByClassName(
      'details-tabs tablink active',
    );
    expect(detailsTabs).toHaveLength(1);

    // check Roll Call content is visible
    elt = document.getElementById('roll-call');
    expect(elt.style.display).toEqual('block');
  });

  test('displays section totals', () => {
    let elt = createAppElt();

    const tabs = document.getElementsByClassName('details-tabs tablink');
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      if (tab.name === 'Section Totals') {
        debug('section totals click', tab.name, tab.onclick);
        tab.onclick({ currentTarget: tab });
      }
    }
    debug('section totals', document.body.innerHTML);

    // check Roll Call content is not visible, and Section Totals is visible
    elt = document.getElementById('roll-call');
    expect(elt.style.display).toEqual('none');
    elt = document.getElementById('section-totals');
    expect(elt.style.display).toEqual('block');
  });

  test('displays section roll call', () => {
    let elt = createAppElt();

    const tabs = document.getElementsByClassName('details-tabs tablink');
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      if (tab.name === 'Section Roll Call') {
        debug('section roll call click', tab.name, tab.onclick);
        tab.onclick({ currentTarget: tab });
      }
    }
    debug('section roll call', document.body.innerHTML);

    // check Roll Call content is not visible, and Section Totals is visible
    elt = document.getElementById('roll-call');
    expect(elt.style.display).toEqual('none');
    elt = document.getElementById('section-roll-call');
    expect(elt.style.display).toEqual('block');
    // content loading is delayed, no hook yet to wait within tests....
  });
});

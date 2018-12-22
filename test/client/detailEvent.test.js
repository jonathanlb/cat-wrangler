/**
 * @jest-environment jsdom
 */

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

describe('Event detail component', () => {
  test('renders', () => {
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
  });
});

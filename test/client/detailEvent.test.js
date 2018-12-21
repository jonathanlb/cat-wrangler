/**
 * @jest-environment jsdom
 */

const detailEvent = require('../../src/client/views/detailEvent');

describe('Event detail component', () => {
  test('renders', () => {
    const details = {
      11: { },
      12: { }
    };
    const app = {
      getEventDetails: async (id) => details,
    }
    const viewOpts = {
      event: {
        id: 1,
        name: 'Testing Huzzah'
      },
      dt: {
        id: 21,
        yyyymmdd: '20181225',
        hhmm: '1300',
        duration: '120m'
      },
    };
    const elt = detailEvent(app, viewOpts);

    document.body.innerHTML = '';
    document.body.append(elt);
  });

});

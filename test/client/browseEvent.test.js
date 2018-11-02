/**
 * @jest-environment jsdom
 */
const browseEvent = require('../../src/client/views/browseEvent');

describe('Browse event component', () => {
  test('renders', () => {
    const app = {};
    const eventObj = {
      id: 17,
      name: 'Tiddlywinks',
      description: '# Grand Championship\n- first prize\n- consolation prizes',
      venue: {
        name: 'Can Can Wonderland',
        address: 'Old Ball Cannery',
        id: 14,
      },
      dateTimes: [
        {
          id: 11, yyyymmdd: '2018-12-01', hhmm: '11:15', duration: '45m',
        },
        {
          id: 12, yyyymmdd: '2018-11-30', hhmm: '23:05', duration: '45m',
        },
        {
          id: 13, yyyymmdd: '2018-12-01', hhmm: '11:30', duration: '45m',
        },
      ],
    };
    const elt = browseEvent(eventObj, app);
    expect(elt.innerHTML.includes('<b>Can Can Wonderland</b>')).toBe(true);
    expect(elt.innerHTML.includes('Championship</h1>')).toBe(true);

    const date11Pos = elt.innerHTML.search('2018\\-12\\-01 11:15');
    const date12Pos = elt.innerHTML.search('2018\\-11\\-30 23:05');
    expect(date11Pos).toBeGreaterThan(0);
    expect(date12Pos).toBeGreaterThan(0);
    expect(date11Pos).toBeGreaterThan(date12Pos);
  });
});

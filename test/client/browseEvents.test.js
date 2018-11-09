/**
 * @jest-environment jsdom
 */
const browseEvents = require('../../src/client/views/browseEvents');

describe('Browse events component', () => {
  test('renders', () => {
    const app = {
      events: {
        1: {
          id: 1,
          name: 'Tiddlywinks',
          description: '# Grand Championship',
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
        },
        2: {
          id: 2,
          name: 'Go Fish',
          description: '# Consolation Round',
          venue: {
            name: 'Can Can Wonderland',
            address: 'Old Ball Cannery',
            id: 14,
          },
          dateTimes: [
            {
              id: 14, yyyymmdd: '2018-12-02', hhmm: '06:15', duration: '15m',
            },
            {
              id: 15, yyyymmdd: '2018-12-02', hhmm: '06:05', duration: '15m',
            },
            {
              id: 16, yyyymmdd: '2018-12-02', hhmm: '06:30', duration: '15m',
            },
          ],
        },
      },
      getRsvpSummary: async (eventId) => {
        switch (eventId) {
          case 1:
            return {
              11: { '-1': 5 },
              12: { 1: 5 },
              13: { '-1': 1, 1: 2 },
            };
          case 2:
            return {
              14: { },
              15: { 1: 2 },
              16: { '-1': 1, 1: 2 },
            };
          default:
            return undefined;
        }
      },
    };
    const elt = browseEvents(app);
    expect(elt.innerHTML.includes('Go Fish')).toBe(true);
    expect(elt.innerHTML.includes('Tiddlywinks')).toBe(true);
  });
});

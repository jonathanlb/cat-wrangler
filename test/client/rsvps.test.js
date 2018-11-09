const rsvpUtils = require('../../src/client/rsvps');

describe('RSVP Summarization', () => {
  test('Counts responses', () => {
    const dtXsums = [
      [{ id: 2 }, { '-1': 2, 0: 1, 1: 5 }],
      [{ id: 3 }, { 0: 1 }],
      [{ id: 4 }, { '-1': 5, 0: 0, 1: 3 }],
    ];
    expect(rsvpUtils.countResponses(dtXsums)).toBe(8);
    expect(rsvpUtils.countResponses([])).toBe(1);
  });

  test('Denormalizes rsvp summary', () => {
    const rsvpSummary = {
      2: { '-1': 2, 0: 1, 1: 5 },
      3: { 0: 1 },
      4: { '-1': 5, 0: 0, 1: 3 },
    };
    const dts = {
      2: {
        id: 2, event: 7, yyyymmdd: '2018-12-01', hhmm: '11:00', duration: '5m',
      },
      3: {
        id: 3, event: 7, yyyymmdd: '2018-12-02', hhmm: '11:00', duration: '5m',
      },
      4: {
        id: 4, event: 7, yyyymmdd: '2018-12-03', hhmm: '11:00', duration: '5m',
      },
    };
    const app = {
      getDateTime: async dtId => dts[dtId],
    };

    return rsvpUtils.denormalizeDateTimeSummary(rsvpSummary, app).
      then(result => expect(result).toEqual([
        [{
          id: 2, event: 7, yyyymmdd: '2018-12-01', hhmm: '11:00', duration: '5m',
        },
        { '-1': 2, 0: 1, 1: 5 }],
        [{
          id: 3, event: 7, yyyymmdd: '2018-12-02', hhmm: '11:00', duration: '5m',
        },
        { 0: 1 }],
        [{
          id: 4, event: 7, yyyymmdd: '2018-12-03', hhmm: '11:00', duration: '5m',
        },
        { '-1': 5, 0: 0, 1: 3 }],
      ]));
  });
});

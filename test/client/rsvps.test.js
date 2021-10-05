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
      getDateTime: async (dtId) => dts[dtId],
    };

    return rsvpUtils.denormalizeDateTimeSummary(rsvpSummary, app).
      then((result) => expect(result).toEqual([
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

  test('Groups responses by section', () => {
    const response = {
      affirmatives: [
        { id: 2, name: 'Dola Player', section: 'mandola' },
        { id: 6, name: 'Harmony Player', section: 'mandolin' },
        { id: 5, name: 'Melody Player', section: 'mandolin' },
      ],
      negatives: [
        { id: 3, name: 'Out deTune', section: 'banjo' },
        { id: 4, name: 'Another Soloist', section: 'fiddle' },
      ],
      neutrals: [
        { id: 1, name: 'Slacker', section: 'mandolin' },
      ],
    };

    const results = rsvpUtils.groupResponsesBySection(response);
    expect(new Set(Object.keys(results))).
      toEqual(new Set(['banjo', 'fiddle', 'mandola', 'mandolin']));
    Object.keys(results).forEach((section) => expect(`${section} ${Object.keys(results[section]).length}`).toEqual(`${section} 3`));
    expect(results.mandolin.neutrals).toEqual(response.neutrals);
  });
});

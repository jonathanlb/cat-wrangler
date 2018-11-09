/**
 * @jest-environment jsdom
 */
const renderRsvpSummary = require('../../src/client/views/rsvpSummary');

describe('RSVP Summary Component', () => {
  test('Renders', () => {
    const dateTimes = {
      11: {
        yyyymmdd: '2018-12-01', hhmm: '10:00', duration: '30m', event: 39,
      },
      12: {
        yyyymmdd: '2018-11-30', hhmm: '10:00', duration: '30m', event: 39,
      },
      13: {
        yyyymmdd: '2018-12-02', hhmm: '10:00', duration: '30m', event: 39,
      },
    };
    const summary = {
      11: { '-1': 1, 0: 1, 1: 2 },
      12: { 1: 1 },
      13: { '-1': 1, 0: 1, 1: 2 },
    };
    const app = {
      getDateTime: async id => dateTimes[id],
    };

    const opts = {};
    const elt = renderRsvpSummary(summary, app, opts);
    expect(elt.children).toHaveLength(0);
    document.body.innerHTML = '';
    document.body.append(elt);
    return opts.postRender.then(() => {
      expect(elt.children).toHaveLength(3);
    });
  });
});

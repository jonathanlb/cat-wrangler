const yo = require('yo-yo');

const renderRsvpBar = require('./heatBar');
const rsvpUtils = require('../rsvps');

/**
 * @param rsvpSummary Map of date-time ids to response summaries.
 *  e.g. {"1":{"0":1,"1":2},"2":{"1":1,"-1":1},"3":{"1":3},"4":{"1":1,"-1":2},"5":{"-1":1}}
 * @param opts options placeholder
 *  - postRender a promise due on render completion.
 *  - rsvpDivId id into which to render
 */
module.exports = (rsvpSummary, app, opts) => {
  const rsvpDivId = opts.rsvpDivId || 'rsvpSummary';
  const rsvps = rsvpUtils.denormalizeDateTimeSummary(rsvpSummary, app);
  const rendered = rsvps.then((dtXsums) => {
    const numResponses = rsvpUtils.countResponses(dtXsums);
    const elt = document.getElementById(rsvpDivId);
    elt.innerHTML = '';
    for (let i = 0; i < dtXsums.length; i++) {
      const dt = dtXsums[i][0];
      const sum = dtXsums[i][1];
      elt.append(yo`<div>${dt.yyyymmdd} ${dt.hhmm} ${dt.duration}: ${renderRsvpBar(sum, numResponses)}</div>`);
    }
  });

  if (opts) {
    opts.postRender = rendered;
  }

  return yo`<div id=${rsvpDivId}></div>`;
};

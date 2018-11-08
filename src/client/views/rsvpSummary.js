const yo = require('yo-yo');

const renderRsvpBar = require('./rsvpBar');
const dtUtils = require('../dateTimes');

/**
 * @param rsvpSummary Map of date-time ids to response summaries.
 *  e.g. {"1":{"0":1,"1":2},"2":{"1":1,"-1":1},"3":{"1":3},"4":{"1":1,"-1":2},"5":{"-1":1}}
 * @param opts options placeholder
 *  - postRender a promise due on render completion.
 *  - rsvpDivId id into which to render
 */
module.exports = (rsvpSummary, app, opts) => {
  const rsvpDivId = opts.rsvpDivId || 'rsvpSummary';

  const rsvps = Promise.all(
    Object.entries(rsvpSummary).
      map((dtXsum) =>
        app.getDateTime(dtXsum[0]).
          then((dt) => [dt, dtXsum[1]]))).
    then((dtXsums) => dtXsums.sort(dtUtils.dtCmp));

  const rendered = rsvps.then((dtXsums) => {
    // Get the highest rsvp count to normalize the response bars
    const totalCount = dtXsums.reduce(
      (a,x) => Math.max(a, Object.values(x[1]).reduce((a,c) => a+c, 0)),
      1);
      
    const elt = document.getElementById(rsvpDivId);
    elt.innerHTML = '';
    for (let i = 0; i < dtXsums.length; i++) {
      const dt = dtXsums[i][0];
      const sum = dtXsums[i][1];
      elt.append(yo`<div>${dt.yyyymmdd} ${dt.hhmm} ${dt.duration}: ${renderRsvpBar(sum, totalCount)}</div>`);
    }
  });

  if (opts) {
    opts.postRender = rendered;
  }

  return yo`<div id=${rsvpDivId}></div>`;
};

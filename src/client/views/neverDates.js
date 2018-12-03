const debug = require('debug')('dates');
const yo = require('yo-yo');

const dtUtils = require('../dateTimes');

module.exports = (app, testOpts) => {
  const datepickerId = 'neverPicker';
  const neversId = 'nevers';
  const neverSubmitId = 'neverSubmit';

  function renderNevers(nevers) {
    debug('renderNevers', nevers);
    const elt = document.getElementById(neversId);
    if (nevers && nevers.length) {
      elt.innerHTML = '';
      nevers.forEach(dateStr =>
        elt.append(yo`<div>${dtUtils.formatDate(dateStr)}</div>`));
    } else {
      elt.innerHTML = 'No dates entered....'
    }
  }

  const neversPromise = app.getNevers().
    then(renderNevers);
  if (testOpts) {
    testOpts.neversPromise = neversPromise;
  }

  const postNevers = () => app.postNevers(
    document.getElementById(datepickerId).value).
    then(app.getNevers).
    then(renderNevers);

  return yo`
    <div>
      <p>
        Tell us which days you cannot attend any event.
        You can always RSVP to an event affirmatively (or negatively) later.
      </p>
      <div class="pickDates" >
        <input id="${datepickerId}" type="date" />
        <br/>
        <input id="${neverSubmitId}"
          onclick=${postNevers}
          type="button"
          value="Cannot Attend" />
      </div>
      <div id="${neversId}">
      </div>
    </div>`;
}

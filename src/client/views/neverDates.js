const debug = require('debug')('dates');
const datepicker = require('js-datepicker');
const datepicker_css = require('js-datepicker/dist/datepicker.min.css');
const dt = require('../dateTimes');
const yo = require('yo-yo');

const dtUtils = require('../dateTimes');

module.exports = (app, testOpts) => {
  const datepickerBorder = 'neverPickerBorder';
  const datepickerId = 'neverPicker';
  const neversId = 'nevers';
  const neverSubmitId = 'neverSubmit';
  let dp;

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

  let observer;
  function installDatePicker() {
    debug('postNevers', datepickerId);
    if (document.getElementById(datepickerId)) {
      observer.disconnect();
      // datepicker floats/doesn't expand parent.
      // hardcode datepicker container height to dp distribution css
      document.getElementById(datepickerBorder).style.height = '180px';
      dp = datepicker(
        `#${datepickerId}`,
        {
          alwaysShow: true,
          formatter: dt.datepickerFormat,
          minDate: new Date()
        });
    }
  }

  observer = new MutationObserver(installDatePicker);
  let config = { attributes: true, childList: true, subtree: true };
  observer.observe(document.getElementById(app.contentDiv), config);

  return yo`
    <div>
      <p>
        Tell us which days you cannot attend any event.
        You can always RSVP to an event affirmatively (or negatively) later.
      </p>
      <div class="pickDates" >
        <div id="${datepickerBorder}">
          <input id="${datepickerId}" type="text" />
        </div>
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

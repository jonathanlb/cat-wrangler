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
  const inputFieldHTML = `<input id="${datepickerId}" type="text" />`;
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

  let observer;
  function installDatePicker() {
    debug('installDatePicker', datepickerId);
    const datepickerDiv = document.getElementById(datepickerBorder);
    if (datepickerDiv) {
      observer.disconnect();
      // datepicker floats/doesn't expand parent.
      // hardcode datepicker container height to datepicker distribution css
      datepickerDiv.style.height = '220px';
      // We break the datepicker by duping it in the document, so make sure
      // it's not already present.
      datepickerDiv.innerHTML = inputFieldHTML;
      const datepickerWidget = datepicker(
        `#${datepickerId}`,
        {
          alwaysShow: true,
          formatter: dt.datepickerFormat,
          minDate: new Date(),
          onSelect: async (instance, date) => {
            if (date) {
              app.postNevers(dt.datepickerFormat({}, date)).
              then(app.getNevers).
              then(renderNevers);
            }
          }
        });
      if (testOpts) {
        // pass datepicker back to test environment for driving.
        testOpts.datepicker = datepickerWidget; // eslint-disable-line
      }
    }
  }

  observer = new MutationObserver(installDatePicker);
  let config = { attributes: true, childList: true, subtree: true };
  observer.observe(document.getElementById(app.contentDiv), config);
  if (testOpts) {
    // test environment doesn't trigger mutation observer...
    testOpts.installDatePicker = installDatePicker; // eslint-disable-line
  }
  return yo`
    <div>
      <p>
        Tell us which days you cannot attend any event.
        You can always RSVP to an event affirmatively (or negatively) later.
      </p>
      <div id="${datepickerBorder}"> ${inputFieldHTML} </div>
      <div id="${neversId}">
      </div>
    </div>`;
}

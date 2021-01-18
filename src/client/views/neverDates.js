const debug = require('debug')('dates');
const datepicker = require('js-datepicker');
const datepicker_css = require('js-datepicker/dist/datepicker.min.css');
const dt = require('../dateTimes');
const yo = require('yo-yo');

const dtUtils = require('../dateTimes');

module.exports = (app, testOpts) => {
  const datepickerHeight = '220px';
  const datepickerBorder = 'neverPickerBorder';
  const dateSelectionBorder = 'neverSelectedBorder';
  const datepickerId = 'neverPicker';
  const dateSelectedId = 'neverSelected';
  const neversId = 'nevers';
  const neverSubmitId = 'neverSubmit';

  let datepickerWidget, dateSelectedWidget;
  let lastNever = new Date(); // for datepickerWidget to redraw dateSelectedWidet
  let neverDates = {};

  function renderNevers(nevers) {
    debug('renderNevers', nevers);
    if (nevers && nevers.length) {
      neverDates = {};
      nevers.forEach(dateStr => {
        const date = dt.dateFromYYYYMMDD(dateStr);
        neverDates[date] = true;
      });
    }
    // trigger redraw -- show/hide don't perform.
    dateSelectedWidget && dateSelectedWidget.setDate(lastNever, true);
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
    // We break the datepicker by duping it in the document, so make sure
    // it's not already present.
    if (datepickerDiv) {
      observer.disconnect();
      const now = new Date();
      // datepicker floats/doesn't expand parent.
      // hardcode datepicker container height to datepicker distribution css.
      datepickerDiv.innerHTML =
        `<h3>Click Dates You Cannot Attend</h3>
          <div style="height:${datepickerHeight}">
            <input id="${datepickerId}" type="text" />
          </div>`;
      datepickerWidget = datepicker(
        `#${datepickerId}`,
        {
          alwaysShow: true,
          formatter: dt.datepickerFormat,
          minDate: now,
          onSelect: async (instance, date) => {
            if (date) {
              lastNever = date;
              app.postNevers(dt.datepickerFormat({}, date)).
              then(app.getNevers).
              then(renderNevers);
            }
          }
        });

        const dateSelectedDiv = document.getElementById(dateSelectionBorder);
        dateSelectedDiv.style.height = datepickerHeight;
        dateSelectedDiv.innerHTML =
          `<h3>You Cannot Attend These Dates</h3>
            <div style="height:${datepickerHeight}">
              <input id="${dateSelectedId}" type="text" />
            </div>`;
        dateSelectedWidget = datepicker(
          `#${dateSelectedId}`,
          {
            alwaysShow: true,
            disabler: date => !neverDates[date],
            formatter: dt.datepickerFormat,
            minDate: now,
            onSelect: undefined
          });

      if (testOpts) {
        // pass datepicker back to test environment for driving.
        testOpts.datepicker = datepickerWidget; // eslint-disable-line
        testOpts.dateSelected = dateSelectedWidget; // eslint-disable-line
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
      <div id="${datepickerBorder}">
      </div>
      <div id="${dateSelectionBorder}">
      </div>
      <div id="${neversId}">
      </div>
    </div>`;
}

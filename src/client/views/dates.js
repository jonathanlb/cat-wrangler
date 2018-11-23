const debug = require('debug')('dates');
const yo = require('yo-yo');

const dtUtils = require('../dateTimes');

module.exports = (app) => {
  const datepickerId = 'neverPicker';
  const neversId = 'nevers';

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

  app.getNevers().
    then(renderNevers);

  return yo`
    <div>
      <div id="${datepickerId}" class="pickDates" >
        <input type="date" />
        <br/>
        <input type="button" value="Cannot Attend" />
      </div>
      <div id="${neversId}">
      </div>
    </div>`;
}

const marked = require('marked');
const yo = require('yo-yo');

const dtUtils = require('../dateTimes');
const switch3w = require('./switch3');

module.exports = (eventObj, app) => {
	const titleId = `event-title-${eventObj.id}`;
	const aboutDivId = `event-${eventObj.id}`;
	const descDivId = `event-md-${eventObj.id}`;
	const venueDivId = `event-venue-${eventObj.id}`;
	const rsvpDivId = `event-rsvp-${eventObj.id}`;

	// TODO: populate with initial values
	function renderDateTime(dt) {
		const f = (vote) => app.rsvp(dt, vote);
		return yo`<li>
			${switch3w(f, { width: 48, height: 18, value: dt.attend})}
		  ${dt.yyyymmdd} ${dt.hhmm} (${dt.duration})
		</li>`;
	}

	let aboutVisible = false;
	function toggleVisibility() {
		aboutVisible = !aboutVisible;
		const aboutDiv = document.getElementById(aboutDivId);
		aboutDiv.style.display = aboutVisible ? 'inherit' : 'none';
	}

  const dateTimeRsvp = eventObj.dateTime ?
		yo`<div class="eventRsvp" id="${rsvpDivId}">
		    <ul>
			    ${ renderDateTime(eventObj.dateTime) }
			  </ul>
      </div>` :
    yo`<div class="eventRsvp" id="${rsvpDivId}">
		    <ul>
			    ${ (eventObj.dateTimes || []).sort(dtUtils.dtCmp).map(renderDateTime) }
			  </ul>
      </div>`;

	const elt = yo`
		<div class="event">
			<h3 id="${titleId}" onclick=${toggleVisibility} >${eventObj.name}</h3>
			<div id="${aboutDivId}" style="display:none">
			  <div id="${descDivId}"></div>
			  <div class="eventAddress" id="${venueDivId}">
					<b>${eventObj.venue.name}</b>
					<br/>
					<i>${eventObj.venue.address}</i>
			  </div>
				${dateTimeRsvp}
			  </div>
		</div>`;

	if (eventObj.description) {
	  const descDiv = elt.querySelector(`#${descDivId}`);
	  descDiv.innerHTML = marked(eventObj.description);
	}

	return elt;
}

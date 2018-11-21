const debug = require('debug')('browseEvent');
const marked = require('marked');
const yo = require('yo-yo');

const dtUtils = require('../dateTimes');
const rsvpUtils = require('../rsvps');
const renderRsvpBar = require('./heatBar');
const switch3w = require('./switch3');

module.exports = (eventObj, app) => {
	const titleId = `event-title-${eventObj.id}`;
	const aboutDivId = `event-${eventObj.id}`;
	const descDivId = `event-md-${eventObj.id}`;
	const venueDivId = `event-venue-${eventObj.id}`;
	const rsvpDivId = `event-rsvp-${eventObj.id}`;

	function populateSummaryCount(rsvpSummary) {
		debug('rsvpSummary', rsvpSummary);
		const rsvpEntries = Object.entries(rsvpSummary);
		const rsvpScale = rsvpUtils.countResponses(rsvpEntries);
		rsvpEntries.forEach(dtXSum => {
			const elt = document.getElementById(
				`rsvpContainer-${eventObj.id}-${dtXSum[0]}`);
			if (elt) {
				elt.innerHTML = '';
				elt.append(renderRsvpBar(dtXSum[1], rsvpScale));
			}
		});
	}

	function renderDateTime(dt) {
		// Send rsvp to server when the user touches the switch and query the
		// rsvp count, updating the rsvp count bars.
		const switchToggled = (vote) =>
			app.rsvp(dt, vote).
				then(() => app.getRsvpSummary(dt.event)).
				then(populateSummaryCount);

		return yo`<tr>
			<td>${switch3w(switchToggled, { width: 48, height: 18, value: dt.attend})}</td>
		  <td>${dtUtils.formatDate(dt.yyyymmdd)} ${dtUtils.formatTime(dt.hhmm)} (${dt.duration})</td>
			<td><div class="rsvpCountBar" id="rsvpContainer-${dt.event}-${dt.id}"></div></td>
		</tr>`;
	}

	let aboutVisible = false;
	function toggleVisibility() {
		aboutVisible = !aboutVisible;
		const aboutDiv = document.getElementById(aboutDivId);
		aboutDiv.style.display = aboutVisible ? 'inherit' : 'none';
	}

  const dateTimeRsvp = eventObj.dateTime ?
		yo`<div class="eventRsvp" id="${rsvpDivId}">
			  ${ renderDateTime(eventObj.dateTime) }
      </div>` :
    yo`<table class="eventRsvp" id="${rsvpDivId}">
		    ${ (eventObj.dateTimes || []).sort(dtUtils.dtCmp).map(renderDateTime) }
      </table>`;

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

	app.getRsvpSummary(eventObj.id).
		then(populateSummaryCount);

	return elt;
}

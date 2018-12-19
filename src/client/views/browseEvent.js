const debug = require('debug')('browseEvent');
const marked = require('marked');
const yo = require('yo-yo');

const dtUtils = require('../dateTimes');
const rsvpUtils = require('../rsvps');
const Views = require('../views');
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

	function renderDetailsSwitch(dt) {
		return yo`<input class="rsvpDetailsButton"
			type="button"
			value="Details"
			onclick=${() => app.render({ event: eventObj, dt, view: Views.EVENT_DETAILS })} />`;
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
			<td><div class="rsvpCountBar" id="rsvpContainer-${dt.event}-${dt.id}"></div>
				${app.organizerUser ? renderDetailsSwitch(dt) : ''}</td>
		</tr>`;
	}

	let aboutVisible = false;
	function toggleVisibility() {
		aboutVisible = !aboutVisible;
		const aboutDiv = document.getElementById(aboutDivId);
		aboutDiv.style.display = aboutVisible ? 'inherit' : 'none';
	}

  const dateTimeRsvp = eventObj.dateTime ?
		yo`<table class="eventRsvp" id="${rsvpDivId}">
			<tr><th>No/??/Yes</th><th>Time Slot</th><th>Total Availability</th></tr>
			  ${ renderDateTime(eventObj.dateTime) }
      </table>` :
    yo`<table class="eventRsvp" id="${rsvpDivId}">
				<tr><th>No/??/Yes</th><th>Time Slot</th><th>Total Availability</th></tr>
		    ${ (eventObj.dateTimes || []).sort(dtUtils.dtCmp).map(renderDateTime) }
      </table>`;

	const displayEventDefault =
		localStorage.showAllEvents === undefined || localStorage.showAllEvents === '1' ?
		'block' : 'none';

	const elt = yo`
		<div class="event">
			<h3 id="${titleId}" onclick=${toggleVisibility} >${eventObj.name}</h3>
			<div id="${aboutDivId}"
				class="highlightTarget"
				style="display:${displayEventDefault}">
			  <div id="${descDivId}"></div>
			  <div class="eventAddress" id="${venueDivId}">
					<b>${eventObj.venue.name}</b>
					<br/>
					<i>${eventObj.venue.address}</i>
			  </div>
			</div>
			${dateTimeRsvp}
		</div>`;

	if (eventObj.description) {
	  const descDiv = elt.querySelector(`#${descDivId}`);
	  descDiv.innerHTML = marked(eventObj.description);
	}

	app.getRsvpSummary(eventObj.id).
		then(populateSummaryCount);

	return elt;
}

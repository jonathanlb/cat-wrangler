const marked = require('marked');
const yo = require('yo-yo');

module.exports = (eventObj, app) => {
	function dtCmp(a, b) {
		return (`${a.yyyymmdd} ${a.hhmm}`).localeCompare(`${b.yyyymmdd} ${b.hhmm}`);
	}

	// TODO: embed controls to RSVP
	function renderDateTime(dt) {
		return yo`<li>${dt.yyyymmdd} ${dt.hhmm} (${dt.duration})</li>`;
	}

	const descDivId = `event-md-${eventObj.id}`;
	// TODO: make event details telescope
	const elt = yo`
		<div class="event">
			<h3>${eventObj.name}</h3>
			<div id="${descDivId}"></div>
			<div class="eventAddress" id="event-venue-${eventObj.id}">
				<ul>
					<li><b>${eventObj.venue.name}</b></li>
					<li>${eventObj.venue.address}</li>
				</ul>
			</div>
			<div class="eventRsvp" id="event-rsvp-${eventObj.id}">
				<ul>
					${ (eventObj.dateTimes || []).sort(dtCmp).map(renderDateTime) }
				</ul>
			</div>
		</div>`;
	const descDiv = Array.from(elt.children).
		find(x => x.id === descDivId);
	descDiv.innerHTML = marked(eventObj.description);
	return elt;
}

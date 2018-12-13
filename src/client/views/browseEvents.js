const yo = require('yo-yo');

const renderEvent = require('./browseEvent');
const highlightOverride = require('./highlightOverride');
const switch2 = require('./switch2');

module.exports = (app) => {
	const sortedEventsId = 'sortedEvents';
	let eventOrder = 1;
	function eventCmp(a, b) {
		const getKey = (e) => {
			if (e.dateTime) {
				return `${e.dateTime.yyyymmdd} ${e.dateTime.hhmm}`;
			} else if (e.dateTimes) {
				return `${e.dateTimes[0].yyyymmdd} ${e.dateTimes[0].hhmm}`;
			}
			return 'ZZZZ'; // shouldn't happen
		}

		return eventOrder * getKey(b).localeCompare(getKey(a));
	}

	function sortedEvents() {
		return Object.values(app.events).sort(eventCmp).
			map((e) =>renderEvent(e, app));
	}

	function toggleEventOrder(x) {
		eventOrder = x;
		let elt = document.getElementById(sortedEventsId);
		yo.update(elt, yo`<div id="${sortedEventsId}">${sortedEvents()}</div>`);
	}

	return yo`
		<div class="eventBrowser">
			<h1>Browse Events</h1>
			<div class="browseEventOptions">
				<table>
					<tr><td>Display all events:</td>
						<td>${highlightOverride({
								f: (x) => { localStorage.showAllEvents = x; },
								value: localStorage.showAllEvents || 1
							})}</td>
					</tr>
					<tr><td>Latest events first:</td>
						<td>${switch2(toggleEventOrder, { height: 16, width: 24, value: eventOrder })}</td>
					</tr>
				</table>
			</div>
			<div id="${sortedEventsId}">${ sortedEvents() }</div>
		</div>
	`;
};

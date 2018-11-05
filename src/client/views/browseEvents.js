const yo = require('yo-yo');

const renderEvent = require('./browseEvent');

module.exports = (app) => {
	function eventCmp(a, b) {
		const getKey = (e) => {
			if (e.dateTime) {
				return `${e.dateTime.yyyymmdd} ${e.dateTime.hhmm}`;
			} else if (e.dateTimes) {
				return `${e.dateTimes[0].yyyymmdd} ${e.dateTimes[0].hhmm}`;
			}
			return 'ZZZZ'; // shouldn't happen
		}

		// put most recent at top of list
		return getKey(b).localeCompare(getKey(a));
	}

	return yo`
		<div class="eventBrowser">
			<h1>Browse Events</h1>
			<ul>
				${ Object.values(app.events).sort(eventCmp).
						map((e) =>
							yo`<li>${ renderEvent(e, app) }</li>`) }
			</ul>
		</div>
	`;
};

const yo = require('yo-yo');

const renderEvent = require('./browseEvent');

module.exports = (app) => {
	function eventCmp(a, b) {
		return `${a.venue && a.venue.name}`.localeCompare(
			`${b.venue && b.venue.name}`);
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

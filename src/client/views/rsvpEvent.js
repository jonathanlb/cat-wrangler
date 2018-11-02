const yo = require('yo-yo');

const renderBrowseEvents = require('./browseEvents');

module.exports = (app) => {
	if (!app.selectedEvent) {
		return renderBrowseEvents(app);
	}

	return yo`
		<div class="eventRsvp">
			<h1>${app.selectedEvent.name}</h1>
			<div class="eventDescription">
			</div>
		</div>
	`;
};

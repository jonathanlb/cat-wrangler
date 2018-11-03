const yo = require('yo-yo');
const Views = require('../views');



module.exports = (app) => {
	if (app.isReady()) {

		async function goBrowse() {
			return app.getEvents().
				then(() => app.render({ view: Views.BROWSE_EVENTS }));
		}

		async function logout() {
			return app.logout();
		}

		async function showSettings() {
			return app.render({ view: Views.USER_SETTINGS });
		}

		return yo`<header>
				<span class="navItem">Wrangler Icon</span>
				<span class="navItem"
					onclick=${showSettings} >
					${app.userName}:</span>
				<span class="navItem"
					onclick=${goBrowse} >
					Events</span>
				<span class="navItem"
					onclick=${logout} >
					Logout</span>
			</header>`;
	}
	return '';
};
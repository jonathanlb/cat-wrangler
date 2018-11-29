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

		async function showAbout() {
			return app.render({ view: Views.ABOUT_APP });
		}

		async function showSettings() {
			return app.render({ view: Views.USER_SETTINGS });
		}

		return yo`<header>
				<span class="navItem"
					onclick=${showAbout} >
					<img src="cat.png"
						height="60"
						alt="alternative text"
						title="Help!"/></span>
				<div>
					<h1>${app.title}</h1>
					<span class="navItem"
						onclick=${showSettings} >
						User Settings
					</span>
					<span class="navItem"
						onclick=${goBrowse} >
						Events
					</span>
					<span class="navItem"
						onclick=${logout} >
						Logout
					</span>
				</div>
			</header>`;
	}
	return '';
};

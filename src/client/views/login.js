const errors = require('debug')('login:error');
const yo = require('yo-yo');

const Views = require('../views');

module.exports = (app) => {
	const passwordFieldId = 'passwordField';
	const userNameFieldId = 'userNameField';

	async function resetPassword() {
		const userName = document.getElementById(userNameFieldId).value.trim();
		if (userName.length) {
			const yesNo = window.confirm('Are you sure you wish to reset your password? ' +
				`A link for your new password will be sent to the email on record for "${userName}"`);
			if (yesNo) {
				return app.resetPassword(userName).
					then(app.logout);
			}
		} else {
			window.alert('Please provide your name in the "User name" field.');
		}
	}

	function setUserNameAndPassword() {
		const passwordField = document.getElementById(passwordFieldId);
		const userNameField = document.getElementById(userNameFieldId);
		const userName = userNameField.value.trim();
		const password = passwordField.value.trim();
		if (userName && password) {
      passwordField.value = '';
      app.setUserNameAndPassword(userName, password).
        then(() => app.getEvents()).
        then(() => app.render({ view: Views.BROWSE_EVENTS })).
        catch((err) => {
          errors('setUserNameAndPassword', err.message);
					app.render({ view: Views.LOGIN });
          switch(err.message.match(/[0-9]*$/)[0]) {
            case '401':
            case '403':
              errors('invalid login');
			        window.alert(
                'Your user name and/or password are invalid.  ' +
                `Please try again.\n${app.loginInstructions}`);
              break;
            case '404':
              errors('cannot locate server');
			        window.alert(
                'The RSVP server is unreachable.\n' +
                app.loginInstructions);
              break;
            case '440':
							errors('login expired');
			        window.alert('Your session has expired.  Please log in again');
              break;
            default:
              errors('cannot login', err.message);
			        window.alert(`Login failed:\n  ${err.message}\n${app.loginInstructions}`);
					}
				});
    }
    return false;
	}

	return yo`
		<form class="login" id="login-form" onsubmit="return false;">
			<h1>${app.title}: Login</h1>
			  <label for="${userNameFieldId}" >User name:</label>
        <input type="text" id="${userNameFieldId}" autocomplete="username"
				  onkeyup=${e => {
					  if (e.key === 'Tab' || e.key === 'Enter') {
						  document.getElementById(passwordFieldId).focus();
					  }
				  }} />
        <br/>
        <label for="${passwordFieldId}" >Password:</label>
        <input type="password" id="${passwordFieldId}" autocomplete="current-password"
          onkeyup=${e => (e.key === 'Enter') && setUserNameAndPassword()} />
        <br/>
        <button onclick=${setUserNameAndPassword} >OK</button>
			  <br/>
			  <br/>
			  <button id="resetPasswordButton" onclick=${resetPassword} >I Forgot My Password</button>
		</form>
	`;
};

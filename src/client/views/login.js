const errors = require('debug')('login:error');
const yo = require('yo-yo');

module.exports = (app) => {
	const passwordFieldId = 'passwordField';
	const userNameFieldId = 'userNameField';

	function setUserNameAndPassword() {
		const passwordField = document.getElementById(passwordFieldId);
		const userName = document.getElementById(userNameFieldId).value.trim();
		const password = passwordField.value.trim();
		if (userName && password) {
			try {
				app.setUserNameAndPassword(userName, password);
			} catch (err) {
				errors('setUserNameAndPassword', err && err.message);
			}
			passwordField.value = '';
		}
	}

	return yo`
		<div class="login">
			<h1>Login to Cat Wrangler (mmmmarrr!)</h1>
			<label for="${userNameFieldId}" >User name:</label>
      <input type="text" id="${userNameFieldId}"
				onkeyup=${e => {
					if (e.key === 'Tab' || e.key === 'Enter') {
						document.getElementById(passwordFieldId).focus();
					}
				}} />
      <br/>
      <label for="${passwordFieldId}" >Password:</label>
      <input type="password" id="${passwordFieldId}"
        onkeyup=${e => (e.key === 'Enter') && setUserNameAndPassword()} />
      <br/>
      <button onclick=${setUserNameAndPassword} >OK</button>
		</div>
	`;
};

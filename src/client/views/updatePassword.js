const debug = require('debug')('updatePassword');
const yo = require('yo-yo');
const Views = require('../views');

module.exports = (app) => {
  function cancel() {
    app.render({ view: Views.USER_SETTINGS });
  }

  async function changePassword() {
    const pass0 = document.getElementById('passwordChange0').value;
    const pass1 = document.getElementById('passwordChange1').value;
    if (pass0 === pass1) {
      await app.updatePassword(pass0);
      return app.render({ view: Views.USER_SETTINGS });
    } else {
      document.getElementById('passwordChange0').value = '';
      document.getElementById('passwordChange1').value = '';
      window.alert('Passwords do not match!');
    }
  }

  return yo`
    <div>
      <table class="updatePassword" >
        <tr><td>
          <label for="passwordChange0">New password:</label>
          <input type="password" id="passwordChange0" />
        </td></tr>
        <tr><td>
          <label for="passwordChange1">Verify new password:</label>
          <input type="password" id="passwordChange1" />
        </td></tr>
        <tr><td>
          <input id="changePasswordButton" type="button" value="Change" onclick=${changePassword} />
          <input id="cancelChangePasswordButton" type="button" value="Cancel" onclick=${cancel} />
        </td></tr>
      </table>
    </div>
  `;
};

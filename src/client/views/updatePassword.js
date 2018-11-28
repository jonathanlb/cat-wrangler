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
      app.render({ view: Views.USER_SETTINGS });
    } else {
      document.getElementById('passwordChange0').value = '';
      document.getElementById('passwordChange1').value = '';
      window.alert('Passwords do not match!');
    }
  }

  return yo`
    <div>
      <input type="password" id="passwordChange0" />
      <input type="password" id="passwordChange1" />
      <input type="button" value="Change" onclick=${changePassword} />
      <input type="button" value="Cancel" onclick=${cancel} />
    </div>
  `;
};

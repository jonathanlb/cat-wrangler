const yo = require('yo-yo');

module.exports = (app) => {
  return yo`
    <table>
      <tr><td><b>Name:</b></td><td>${app.userName}</td></tr>
      <tr><td><b>Profile picture:</b></td><td>TODO</td></tr>
      <tr><td><b>Password:</b></td><td><input type="button" value="Change" /></td></tr>
      <tr><td><b>Section:</b></td><td>${app.userSection}</td></tr>
    </table>
  `;
};

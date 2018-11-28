const debug = require('debug')('userSettings');
const yo = require('yo-yo');
const renderDates = require('./dates');
const divViz = require('../toggleDivViz');
const Views = require('../views');

module.exports = (app) => {
  const blackOutDivId = 'blackOutDates';
  const personalInfoDivId = 'personalInfo';

  function updatePassword() {
    app.render({ view: Views.UPDATE_PASSWORD });
  }

  async function updateSection() {
    const proposedSection = document.getElementById('sectionText').value;
    debug('updateSection', proposedSection);
    const newSection = await app.updateSection(proposedSection);
    if (newSection) {
      debug('updatedSection', newSection);
      document.getElementById('sectionText').value = newSection;
    }
  }

  return yo`
    <div>
      <h2 class="highlightable"
        onclick=${divViz(personalInfoDivId)}>
        Personal
      </h2>
      <div id="${personalInfoDivId}" style="display:none" class="userInfo" >
        <table>
          <tr><td><b>Name:</b></td>
            <td>${app.userName}</td></tr>
          <tr><td><b>Password:</b></td>
            <td><input type="button" value="Change" onclick=${updatePassword} /></td></tr>
          <tr><td><b>Section:</b></td>
            <td><input id="sectionText"
              type="text"
              onkeyup=${e => (e.key === 'Enter') && updateSection()}
              value="${app.userSection}" />
            </td>
          </tr>
        </table>
      </div>
      <h2 class="highlightable"
        onclick=${divViz(blackOutDivId)} >
        Blackout Dates
      </h2>
      <div id="${blackOutDivId}" style="display:none" class="userInfo">
        <p>List days that you cannot participate.</p>
        ${renderDates(app)}
      </div>
    </div>
  `;
};

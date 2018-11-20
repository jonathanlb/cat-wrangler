// $2000 Scard
// $4400 jcard
// ref# 54577592
const debug = require('debug')('userSettings');
const yo = require('yo-yo');
const renderDates = require('./dates');
const divViz = require('../toggleDivViz');

module.exports = (app) => {
  const blackOutDivId = 'blackOutDates';

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
      <table>
        <tr><td><b>Name:</b></td>
          <td>${app.userName}</td></tr>
        <tr><td><b>Password:</b></td>
          <td><input type="button" value="Change" /></td></tr>
        <tr><td><b>Section:</b></td>
          <td><input id="sectionText"
            type="text"
            onkeyup=${e => (e.key === 'Enter') && updateSection()}
            value="${app.userSection}" />
          </td>
        </tr>
      </table>
      <h2 class="highlightable"
        onclick=${divViz(blackOutDivId)} >
        Blackout Dates
      </h2>
      <div id="${blackOutDivId}" style="display:none">${renderDates(app)}
      </div>
    </div>
  `;
};

const debug = require('debug')('details');
const yo = require('yo-yo');

const renderHeatBar = require('./heatBar');
const dtUtils = require('../dateTimes');
const rsvpUtils = require('../rsvps');

module.exports = (app, viewOpts) => {
  const affirmativeDivId = 'affirmativeRsvps';
  const negativeDivId = 'negativeRsvps';
  const unknownDivId = 'unknownRsvps';

  debug('renderDetails', app, viewOpts);
  const { event, dt } = viewOpts;

  app.getEventDetails(event.id).
    then(async (details) => {
      // details in the form of dtId => userId => response
      // TODO: render and defer computation
      const affirmatives = [];
      const negatives = [];
      const neutrals = [];
      const dateDetail = details[dt.id];

      debug('details', dt.id, details);
      for (let partId in dateDetail) {
        const attend = dateDetail[partId];
        const userInfo = await app.getUserInfo(partId);
        if (attend > 0) {
          affirmatives.push(userInfo);
        } else if (attend < 0) {
          negatives.push(userInfo);
        } else {
          neutrals.push(userInfo);
        }
      }

      // TODO: generalize and reuse for section roll call
      // Fill out positive/affirmative/unknown names
      let numResponses = 0;
      const usersResponse = {
        [affirmativeDivId]: affirmatives,
        [negativeDivId]: negatives,
        [unknownDivId]: neutrals,
      };
      for (let i in usersResponse) {
        const users = usersResponse[i].sort((a, b) => a.name.localeCompare(b.name));
        const nameLis = users.map((u) => yo`<li>${u.name} (${u.section || '?'})</li>`);
        const elt = document.getElementById(i);
        elt.innerHTML ='';
        if (nameLis.length) {
          elt.append(yo`<ul class="rsvpList">${nameLis}</ul>`);
          numResponses += nameLis.length;
        } else {
          elt.append(yo`<em>none</em>`);
        }
      }
      document.getElementById('numResponses').innerText =
        `Total responses: ${numResponses}`;

      // fill out by-section
      const sections = {};
      affirmatives.forEach((u) => {
        const { section } = u;
        if (!sections[section]) {
          sections[section] = { '1': 0, '0': 0, '-1': 0 };
        }
        sections[section]['1'] += 1;
      });
      neutrals.forEach((u) => {
        const { section } = u;
        if (!sections[section]) {
          sections[section] = { '1': 0, '0': 0, '-1': 0 };
        }
        sections[section]['0'] += 1;
      });
      negatives.forEach((u) => {
        const { section } = u;
        if (!sections[section]) {
          sections[section] = { '1': 0, '0': 0, '-1': 0 };
        }
        sections[section]['-1'] += 1;
      });
      debug('section details', sections);
      const sectionDetails = document.getElementById('sectionDetails');
      sectionDetails.innerHTML = '';
      const sectionRows = Object.entries(sections).map(
        (sectionXresponses) => {
          const [section, responses] = sectionXresponses;
          const count = (responses['1'] || 0) +
            (responses['0'] || 0) +
            (responses['-1'] || 0);
          debug('section detail', section, count, responses);
          return yo`<tr>
            <td>${section}</td>
            <td>(${count})<div class="rsvpCountBar">${renderHeatBar(responses, count)}</div></td>
          </tr>`;
      });
      sectionDetails.append(
        yo`<table><tr><th>Section</th><th>Response</th></tr>${sectionRows}</table>`);
    });

  function openTab(tabDivName) {
    return (event) => {
      const tabbedContent = document.getElementsByClassName("tabcontent");
      for (let i = 0; i < tabbedContent.length; i++) {
        tabbedContent[i].style.display = 'none';
      }

      const tabs = document.getElementsByClassName('tablink');
      for (let i = 0; i < tabs.length; i++) {
        tabs[i].className = tabs[i].className.replace(' active', '');
      }

      document.getElementById(tabDivName).style.display = 'block';
      event.currentTarget.className += ' active';
    }
  }

  const spinner = yo`<img src="spinner.svg" class="spinner" />`;

  return yo`
    <div class="eventDetails" >
      <h2>RSVP Details</h2>
      ${event.name}
      <br/>
      ${dtUtils.formatDate(dt.yyyymmdd)} ${dtUtils.formatTime(dt.hhmm)} (${dt.duration})
      <p id="numResponses"></p>

      <div class="tabbed-container">
        <div class="tab">
          <button class="tablink active" onclick=${openTab('roll-call')}>
            Roll Call
          </button>
          <button class="tablink" onclick=${openTab('section-roll-call')}>
            Section Roll Call
          </button>
          <button class="tablink" onclick=${openTab('section-totals')}>
            Section Totals
          </button>
        </div>
  
        <div id="section-totals" class="tabcontent">
          <div id="sectionDetails" class="sectionDetails" >
            ${spinner}
          </div>
        </div>
  
        <div id="roll-call" class="tabcontent" style="display:block">
          <div id="rollCallDetails" class="rollCallDetails" >
            <div>
              <h4>Affirmative</h4>
              <div id="${affirmativeDivId}" class="sectionDetails" >
                ${spinner}
              </div>
            </div>
            <div>
              <h4>Neutral</h4>
              <div id="${unknownDivId}" class="sectionDetails" >
                ${spinner}
              </div>
            </div>
            <div>
              <h4>Negative</h4>
              <div id="${negativeDivId}" class="sectionDetails" >
                ${spinner}
              </div>
            </div>
          </div>
        </div>

        <div id="section-roll-call" class="tabcontent">
          <h3>TODO: Section Roll Call</h3>
          ${spinner}
        </div>
      </div>
    </div>`;
}

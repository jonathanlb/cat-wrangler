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
      debug('details', dt.id, details);
      // TODO: break up this promise
      // details in the form of dtId => userId => response
      const { affirmatives, negatives, neutrals } = 
        await rsvpUtils.getResponses({ app, dateDetail: details[dt.id] });

      // Fill out positive/affirmative/unknown names for roll call
      let responseCounts = {
        affirmatives: 0,
        negatives: 0,
        neutrals: 0,
        total: 0
      };
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
          const count = nameLis.length;
          elt.append(yo`<ul class="rsvpList">${nameLis}</ul>`);
          responseCounts.total += count;
          responseCounts[i] = count;
          document.getElementById(`${i}-count`).innerText = `(${count})`;
        } else {
          elt.append(yo`<em>none</em>`);
        }
      }
      document.getElementById('numResponses').innerText =
        `Total responses: ${responseCounts.total}`;

      // Fill out sectional roll call
      const sectionResponses = rsvpUtils.groupResponsesBySection({
        affirmatives: usersResponse[affirmativeDivId],
        negatives: usersResponse[negativeDivId],
        neutrals: usersResponse[unknownDivId]
      });
      const sectionRollCalls = document.getElementById('sectionRollCalls');
      sectionRollCalls.innerHTML = '';
      sectionRollCalls.append(
        yo`<div class="tab">
          ${Object.keys(sectionResponses).sort().map(section =>
            yo`
              <button class="section-tabs tablink"
						    onclick=${openTab('section-tabs', `roll-call-${section}`)}
								name=${`roll-call-${section}`}>
                ${section}
              </button>`
          )}
        </div>`);
      for (let section in sectionResponses) {
        const sectionRollCall = yo`
        <div id="roll-call-${section}" class="section-tabs tabcontent">
          <div class="section-tab-content">
            <div class="section-response">
              <h4>Affirmative (${sectionResponses[section].affirmatives.length})</h4>
              <ul class="rsvpList">
                ${sectionResponses[section].affirmatives.map(x => yo`<li>${x.name}</li>`)}
              </ul>
            </div>
            <div class="section-response">
              <h4>Neutral (${sectionResponses[section].neutrals.length})</h4>
              <ul class="rsvpList">
                ${sectionResponses[section].neutrals.map(x => yo`<li>${x.name}</li>`)}
              </ul>
            </div>
            <div class="section-response">
              <h4>Negative (${sectionResponses[section].negatives.length})</h4>
              <ul class="rsvpList">
                ${sectionResponses[section].negatives.map(x => yo`<li>${x.name}</li>`)}
              </ul>
            </div>
          </div>
        </div> `;
        sectionRollCalls.append(sectionRollCall);
      }

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

  function openTab(tabGroup, tabDivName) {
    return (event) => {
      const tabbedContent = document.getElementsByClassName(`${tabGroup} tabcontent`);
      debug('openTab hiding', tabGroup, 'for', tabDivName);
      for (let i = 0; i < tabbedContent.length; i++) {
        tabbedContent[i].style.display = 'none';
      }

      const tabs = document.getElementsByClassName(`${tabGroup} tablink`);
      for (let i = 0; i < tabs.length; i++) {
        tabs[i].className = tabs[i].className.replace(' active', '');
      }

      document.getElementById(tabDivName).style.display = 'block';
      event.currentTarget.className += ' active';
    }
  }

	/** 
	 * In opening the section roll call details tab, make sure there is a
	 * default pane open, and it's tab button is active.
	 */
	function openDetailsTab() {
    const f = openTab('details-tabs', 'section-roll-call');
    return (event) => {
			f(event);
			
			const content = document.getElementById('sectionRollCalls');
			if (content && content.children.length > 1) {
			  // don't show the default if we've shown any of the section tabs before.
				for (let i = 0; i < content.children.length; i++) {
					const pane = content.children[i];
					if (pane.style.display === 'block') {
						return;
					}
				}

				// choose a default pane to show
				const pane = content.children[1];
				pane.style.display = 'block';
				const paneId = pane.id;
				debug('default section', paneId);

				// infer the tab names association and show the default
				const tabs = document.getElementsByClassName('section-tabs tablink');
				for (let i = 0; i < tabs.length; i++) {
					const tab = tabs[i];
					if (paneId.endsWith(tab.innerText.trim())) {
						tab.className += ' active';
					} else {
						tab.className = tab.className.replace(' active', '');
					}
				}
			}
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
          <button class="details-tabs tablink active"
	          onclick=${openTab('details-tabs', 'roll-call')}
		        name="Roll Call">
            Roll Call
          </button>
          <button class="details-tabs tablink"
	          onclick=${openDetailsTab()}
		        name="Section Roll Call">
            Section Roll Call
          </button>
          <button class="details-tabs tablink"
	          onclick=${openTab('details-tabs', 'section-totals')}
		        name="Section Totals">
            Section Totals
          </button>
        </div>
  
        <div id="section-totals" class="details-tabs tabcontent">
          <div id="sectionDetails" class="sectionDetails" >
            ${spinner}
          </div>
        </div>
  
        <div id="roll-call" class="details-tabs tabcontent" style="display:block">
          <div id="rollCallDetails" class="rollCallDetails" >
            <div>
              <h4>Affirmative <span id="${affirmativeDivId}-count"></span></h4>
              <div id="${affirmativeDivId}" class="sectionDetails" >
                ${spinner}
              </div>
            </div>
            <div>
              <h4>Neutral <span id="${unknownDivId}-count"></span></h4>
              <div id="${unknownDivId}" class="sectionDetails" >
                ${spinner}
              </div>
            </div>
            <div>
              <h4>Negative <span id="${negativeDivId}-count"></span></h4>
              <div id="${negativeDivId}" class="sectionDetails" >
                ${spinner}
              </div>
            </div>
          </div>
        </div>

        <div id="section-roll-call" class="details-tabs tabcontent">
          <div id="sectionRollCalls" class="sectionDetails tabbed-container" >
            ${spinner}
          </div>
        </div>
      </div>
    </div>`;
}

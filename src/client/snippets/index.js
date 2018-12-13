/**
 * Launching pad to demonstrate snippets of UI for stuff that might
 * be hard to unit test... boo! ... layout, etc.
 */
const yo = require('yo-yo');

const divViz = require('../toggleDivViz');
const heatBar = require('../views/heatBar');
const highlightOverride = require('../views/highlightOverride');
const switch2w = require('../views/switch2');
const switch3w = require('../views/switch3');

const mainDivId = 'main-app';
const mainDiv = document.getElementById(mainDivId);
const innerHTML = yo`<div>
  <h2>Highlight Override</h2>
  <div style="display:flex" >
    Toggle visibility of all the sections: ${highlightOverride()}
  </div>

  <h2 class="highlightable"
    onclick=${divViz('switch2wDemo')} >
    2-way Switch
  </h2>
  <div class="highlightTarget" id="switch2wDemo" style="display:none" >
    ${switch2w(
        (x) => document.getElementById('switch2Value').innerText = x,
        { width: 60, height: 36, value: -1 })}
    <br />Switch value:<span id="switch2Value">-1</span>
  </div>

  <h2 class="highlightable"
    onclick=${divViz('switch3wDemo')} >
    3-way Switch
  </h2>
  <div class="highlightTarget" id="switch3wDemo" style="display:none" >
    ${switch3w(
        (x) => document.getElementById('switch3Value').innerText = x,
        { width: 60, height: 36, value: 0 })}
    <br />Switch value:<span id="switch3Value">0</span>
  </div>

  <h2 class="highlightable"
    onclick=${divViz('heatBarDemo')} >
    Heat Bar
  </h2>
  <div class="highlightTarget" id="heatBarDemo" style="display:none;width:35%" >
    ${heatBar({ '-1': 16, '1': 17 }, 35)}
    <br />Responses: 16/2/17
  </div>
</div>`;

yo.update(mainDiv, innerHTML);

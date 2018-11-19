/**
 * Launching pad to demonstrate snippets of UI for stuff that might
 * be hard to unit test... boo! ... layout, etc.
 */
const yo = require('yo-yo');

const switch3w = require('../views/switch3');
const divViz = require('../toggleDivViz');

const mainDivId = 'main-app';
const mainDiv = document.getElementById(mainDivId);
const innerHTML = yo`<div>
  <h2 class="highlightable"
    onclick=${divViz('switch3wDemo')} >
    3-way Switch
  </h2>
  <div id="switch3wDemo" style="display:none" >
    ${switch3w(
        (x) => document.getElementById('switchValue').innerText = x,
        { width: 60, height: 36, value: 0 })}
    <br />Switch value:<span id="switchValue">0</span>
  </div>
</div>`;

yo.update(mainDiv, innerHTML);

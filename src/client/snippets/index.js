const yo = require('yo-yo');

const switch3w = require('../views/switch3');

const mainDivId = 'main-app';
const mainDiv = document.getElementById(mainDivId);
const innerHTML = yo`<div>
  <h2>3-way Switch</h2>
  <div id="switch3wDemo">
    ${switch3w(
        (x) => document.getElementById('switchValue').innerText = x,
        { width: 48, height: 18, value: 0 })}
    <br />Switch value:<span id="switchValue">0</span>
  </div>
</div>`;

yo.update(mainDiv, innerHTML);

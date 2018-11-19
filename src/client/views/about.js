const debug = require('debug')('about');
const errors = require('debug')('about:errors');
const yo = require('yo-yo');

module.exports = (app) => {
  const aboutDivId = 'aboutCatWrangler';
  const elt = yo`<div id="${aboutDivId}"></div>`;
  const url = `${app.serverPrefix}/about.html`;
  debug('about fetch', url);
  fetch(url).
    then((response) => response.text()).
    then((text) => {
      document.getElementById(aboutDivId).
        innerHTML = text;
    }).
    catch((e) => errors(e));
  return elt;
};
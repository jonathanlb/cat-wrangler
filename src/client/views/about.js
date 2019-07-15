const debug = require('debug')('about');
const errors = require('debug')('about:errors');
const yo = require('yo-yo');

// libraries for embedded content
const basicAuthF = require('../basicAuth');
const divViz = require('../toggleDivViz');

module.exports = (app, testOpts) => {
  const aboutDivId = 'aboutCatWrangler';
  const elt = yo`<div id="${aboutDivId}"></div>`;
  const url = `${app.serverPrefix}/about.html`;
  debug('about fetch', url);
  const fetchPromise = fetch(url).
    then((response) => response.text()).
    then((text) => {
      // Make visibility toggling global so content can use it.
      window.basicAuth = basicAuthF(app);
      window.divViz = divViz;

      document.getElementById(aboutDivId).
        innerHTML = text;
    }).
    catch((e) => {
      errors(e);
      document.getElementById(aboutDivId).
        innerHTML = 'Cannot connect to server.  Please try again later.' +
          `<br/><pre>${e.message}</pre>`;
    });

  if (testOpts) {
    testOpts.fetchPromise = fetchPromise;
  }

  return elt;
};

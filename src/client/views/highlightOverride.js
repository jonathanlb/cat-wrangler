const debug = require('debug')('highlightOverride');
const yo = require('yo-yo');

const switch2 = require('./switch2');

module.exports = (opts) => {
  const className = (opts && opts.highlightTargetClass) || 'highlightTarget';
  const extraToggle = (opts && opts.f) || (() => undefined);

  function toggleHighlight(x) {
    const elts = document.getElementsByClassName(className);
    const display = x > 0 ? 'block' : 'none';
    debug('toggle all', display, elts.length);
    for (let i = elts.length - 1; i >=0; i -=1) {
      elts[i].style.display = display;
    }
    extraToggle(x);
  }

  const switchOpts = {
    height: (opts && opts.height) || 16,
    width: (opts && opts.width) || 24,
    value: (opts && opts.value) || -1,
  };
  if (typeof switchOpts.value === 'string') {
    switchOpts.value = parseInt(switchOpts.value);
  }

  return yo`${switch2(toggleHighlight, switchOpts)}`;
}

/**
 * Provide a function, e.g. for onclick, to toggle element visibility.
 * Setting the display value toggles visibility, but it doesn't allow
 * transitions.  opacity and max-height can be transitioned, but max-height
 * transitions at a rate proportional to the max height, which is PITA to
 * calculate the right value, overcalculating leads to late transitions.....
 */
module.exports = (divId) => () => {
  const elt = document.getElementById(divId);
  if (elt.style.display === 'none') {
    elt.style.display = 'block';
  } else {
    elt.style.display = 'none';
  }
};

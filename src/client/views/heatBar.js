/**
 * Represent the popularity/heat of a response as a horizontal bar.
 * The division of the end colors represent the strength of the response,
 * with left being negative and right positive.
 *
 * Consider refactoring to keep static content, but allow updates to style
 * to support transitions.
 */
const yo = require('yo-yo');

module.exports = (rsvpCount, totalCount) => {
  function width(count) {
    if (!count) {
      return '0px';
    } return `${100*count/totalCount}%`;
  }

  return yo`<div class="rsvpBar">
    <div class="rsvpNegative" style="width:${width(rsvpCount['-1'])}"></div>
    <div class="rsvpPositive" style="width:${width(rsvpCount['1'])}"></div>
  </div>`;
}

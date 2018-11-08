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

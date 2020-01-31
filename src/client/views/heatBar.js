/**
 * Represent the popularity/heat of a response as a horizontal bar.
 * The division of the end colors represent the strength of the response,
 * with left being negative and right positive.
 *
 * Consider refactoring to keep static content, but allow updates to style
 * to support transitions.
 */
const debug = require('debug')('heatBar');
const yo = require('yo-yo');

let rsvpBarWidth;
function getRsvpBarWidth() {
	if (!rsvpBarWidth) {
		// XXX can throw error early on....
		const widthStr = window.getComputedStyle(
			document.getElementsByClassName('rsvpBar')[0])['width'];
		rsvpBarWidth = parseInt(widthStr.match(/([0-9]+)px/)[1], 10);
	}
	return rsvpBarWidth;
}

let padding;
function getPadding() {
	if (padding === undefined) {
		try {
			// We cannot get the padding %, short of parsing css. 
			// The actual width isn't available until after we compute layout... here.
			// XXX hard code 3% to account for the 3% padding used to offset text
			padding = 0.03 * getRsvpBarWidth();
		} catch (e) {
			debug('padding', e);
			return 0;
		}
	}
	return padding;
}

module.exports = (rsvpCount, totalCount) => {
  function width(count) {
    if (!count) {
      return '0px';
    } else {
			const widthNetPadding = 100 - 2*getPadding();
			return `${widthNetPadding*count/totalCount}%`;
		}
  }

  return yo`<div class="rsvpBar">
    <div class="rsvpNegative" style="width:${width(rsvpCount['-1'])}">
		  ${rsvpCount['-1']}
		</div>
    <div class="rsvpPositive" style="width:${width(rsvpCount['1'])}">
		  ${rsvpCount['1']}
		</div>
  </div>`;
}

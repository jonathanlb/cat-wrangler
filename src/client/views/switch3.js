const yo = require('yo-yo');

let toggleCounter = 0;

module.exports = (switchToggled, opts) => {
	const bodyClass = (opts && opts.bodyClass) || 'switch3w-body';
	const toggleClass = (opts && opts.toggleClass) || 'switch3w-toggle';

	const bodyId = (opts && opts.bodyId) || `switch3w-${toggleCounter}`;
	const toggleId = (opts && opts.toggleId) || `switch3w-toggle-${toggleCounter}`;
	toggleCounter += 1;

	const bodyStyles = [];
	const toggleStyles = [];
	if (opts && opts.width) {
		bodyStyles.push(`width:${opts.width}px`);
	}
	if (opts && opts.height) {
		bodyStyles.push(`height:${opts.height}px`);
		bodyStyles.push(`border-radius:${opts.height}px`);
		const toggleHeight = opts.height - 3; // XXX hard-coded borderWidth/slop
		toggleStyles.push(`height:${toggleHeight}px`);
		toggleStyles.push(`width:${toggleHeight}px`);
		toggleStyles.push(`border-radius:${toggleHeight}px`); // high val is round
	}
	if (opts && opts.height && opts.width) {
		if (opts.value && opts.value > 0) {
			toggleStyles.push('background:green');
      // border slop
		  toggleStyles.push(`margin-left:${opts.width - opts.height - 1}px`);
		} else if (opts.value && opts.value < 0) {
			toggleStyles.push('background:red');
		  toggleStyles.push(`margin-left:0px`);
		} else {
		  toggleStyles.push(`margin-left:${(opts.width - opts.height)/ 2}px`);
		}
	}
	const bodyStyleStr = bodyStyles.join(';');
	const toggleStyleStr = toggleStyles.join(';');

	function toggle(e) {
		const toggle = document.getElementById(toggleId);
		const body = document.getElementById(bodyId);
		const x = e.offsetX;
		const thirds = (
			body.offsetWidth ||
			parseInt(body.style.width.replace('px', ''), 10)
		) / 3;
		const bodyStyle = window.getComputedStyle(body);
		// more border hardcode....
		const borderSlop = 2*parseInt(bodyStyle.borderLeftWidth.replace('px', ''), 10);

		// TODO: parameterize toggle colors
		let toggleValue;
		if (x <= thirds) {
			toggle.style.background = 'red';
			toggle.style['margin-left'] = '0px';
			toggleValue = -1;
		} else if (x >= 2*thirds) {
			toggle.style.background = 'green';
			toggle.style['margin-left'] = `${(body.offsetWidth - toggle.offsetWidth) - borderSlop}px`;
			toggleValue = 1;
		} else {
			toggle.style.background = 'darkgrey';
			toggle.style['margin-left'] = `${(body.offsetWidth - toggle.offsetWidth - borderSlop) / 2}px`;
			toggleValue = 0;
		}
		switchToggled(toggleValue);
	}

	return yo`<div id="${bodyId}" style="${bodyStyleStr}" class="${bodyClass}"
			onclick=${toggle} >
			<div id="${toggleId}" style="${toggleStyleStr}" class="${toggleClass}"></div>
		</div>`;
};

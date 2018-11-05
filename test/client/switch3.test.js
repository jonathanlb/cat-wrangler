/**
 * @jest-environment jsdom
 */

const switch3 = require('../../src/client/views/switch3');

// adapted from https://stackoverflow.com/questions/3277369/how-to-simulate-a-click-by-using-x-y-coordinates-in-javascript
function click(elt, x, y) {
  const e = document.createEvent('MouseEvent');
  e.initMouseEvent(
    'click',
    true /* bubble */, true /* cancelable */,
    window, null,
    x, y, 0, 0, /* coordinates */
    false, false, false, false, /* modifier keys */
    0 /* left */, null,
  );
  e.offsetX = x; // not passed along in initMouseEvent
  e.offsetY = y;
  elt.dispatchEvent(e);
}

describe('3-way Switch Component', () => {
  test('renders', () => {
    let lastValue;
    function toggled(v) {
      lastValue = v;
    }

    let elt = switch3(toggled, { width: 300, height: 100 });
    document.body.innerHTML = '';
    document.body.appendChild(elt);
    elt = document.getElementById('switch3w-0');

    expect(elt).not.toBe(null);
    // JSDOM doesn't render completely
    // expect(elt.offsetWidth).toEqual(300);
    expect(elt.style.width).toEqual('300px');
    click(elt, 10, 50);
    expect(lastValue).toBe(-1);
    click(elt, 275, 50);
    expect(lastValue).toBe(1);
    click(elt, 150, 50);
    expect(lastValue).toBe(0);
  });
});

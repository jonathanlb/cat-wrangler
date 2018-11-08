/**
 * @jest-environment jsdom
 */
const renderRsvpBar = require('../../src/client/views/rsvpBar');

describe('RSVPBar tests', () => {
  test('Renders negative responses', () => {
    const elt = renderRsvpBar({'-1': 1}, 4);
    expect(elt.children[0].style.width).toEqual('25%');
    expect(elt.children[1].style.width).toEqual('0px');
  });

  test('Renders positive responses', () => {
    const elt = renderRsvpBar({1: 2}, 4);
    expect(elt.children[0].style.width).toEqual('0px');
    expect(elt.children[1].style.width).toEqual('50%');
  });

  test('Renders positive and negative responses', () => {
    const elt = renderRsvpBar({1: 2, '-1': 1}, 4);
    expect(elt.children[0].style.width).toEqual('25%');
    expect(elt.children[1].style.width).toEqual('50%');
  });

  test('Renders without responses', () => {
    const elt = renderRsvpBar({'0': 4}, 4);
    expect(elt.children[0].style.width).toEqual('0px');
    expect(elt.children[1].style.width).toEqual('0px');
  });
});

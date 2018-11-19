/**
 * Provide a function, e.g. for onclick, to toggle element visibility.
 */
module.exports = (divId) =>
  () => {
    const elt = document.getElementById(divId);
    if (elt.style.display === 'none') {
      elt.style.display = 'block';
    } else {
      elt.style.display = 'none';
    }
  };

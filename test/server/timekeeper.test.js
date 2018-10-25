const Timekeeper = require('../../src/server/timekeeper');

describe('Timekeeper', () => {
  test('close is optional', () => {
    const tk = new Timekeeper();
    return tk.close().
      then(result => expect(result).toBe(tk));
  });

  test('setup is optional', () => {
    const tk = new Timekeeper();
    return tk.setup().
      then(result => expect(result).toBe(tk));
  });

  test('closeEvent is not implemented', () => {
    const tk = new Timekeeper();
    return expect(tk.closeEvent(1, 2)).rejects.toBeDefined();
  });

  test('collectRsvps is not implemented', () => {
    const tk = new Timekeeper();
    return expect(tk.collectRsvps(1)).rejects.toBeDefined();
  });

  test('createDateTime is not implemented', () => {
    const tk = new Timekeeper();
    return expect(tk.createDateTime(1, '2018-12-01', '7:00', '15m')).rejects.toBeDefined();
  });

  test('createEvent is not implemented', () => {
    const tk = new Timekeeper();
    return expect(tk.createEvent('Prom', 1, '# Markdown!')).rejects.toBeDefined();
  });

  test('createParticipant is not implemented', () => {
    const tk = new Timekeeper();
    return expect(tk.createParticipant('Bilbo', 'secret', true)).rejects.toBeDefined();
  });

  test('createVenue is not implemented', () => {
    const tk = new Timekeeper();
    return expect(tk.createVenue('My House', 'The Wrong Side of the Tracks')).rejects.toBeDefined();
  });

  test('rsvp is not implemented', async () => {
    const tk = new Timekeeper();
    return expect(tk.rsvp(1, 2, 3, 0)).rejects.toBeDefined();
  });
});

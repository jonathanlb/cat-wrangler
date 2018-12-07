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

  test('changePassword is not implemented', () => {
    const tk = new Timekeeper();
    return expect(tk.changePassword(12, 'secret')).rejects.toBeDefined();
  });

  test('checkSecret is not implemented', () => {
    const tk = new Timekeeper();
    return expect(tk.checkSecret(12, 'secret')).rejects.toBeDefined();
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

  test('getDatetime is not implemented', () => {
    const tk = new Timekeeper();
    return expect(tk.getDatetime(19)).rejects.toBeDefined();
  });

  test('getEvent is not implemented', () => {
    const tk = new Timekeeper();
    return expect(tk.getEvent(1)).rejects.toBeDefined();
  });

  test('getEvents is not implemented', () => {
    const tk = new Timekeeper();
    return expect(tk.getEvents({})).rejects.toBeDefined();
  });

  test('getNevers is not implemented', () => {
    const tk = new Timekeeper();
    return expect(tk.getNevers(1)).rejects.toBeDefined();
  });

  test('getRsvps is not implemented', () => {
    const tk = new Timekeeper();
    return expect(tk.getRsvps(19, 21)).rejects.toBeDefined();
  });

  test('getUserId is not implemented', () => {
    const tk = new Timekeeper();
    return expect(tk.getUserId('Bilbo')).rejects.toBeDefined();
  });

  test('getUserInfo is not implemented', () => {
    const tk = new Timekeeper();
    return expect(tk.getUserInfo(19)).rejects.toBeDefined();
  });

  test('getVenues is not implemented', () => {
    const tk = new Timekeeper();
    return expect(tk.getVenues({})).rejects.toBeDefined();
  });

  test('never is not implemented', () => {
    const tk = new Timekeeper();
    return expect(tk.never(1, '2018-12-01')).rejects.toBeDefined();
  });

  test('resetPassword is not implemented', async () => {
    const tk = new Timekeeper();
    return expect(tk.resetPassword('Bilbo')).rejects.toBeDefined();
  });

  test('rsvp is not implemented', async () => {
    const tk = new Timekeeper();
    return expect(tk.rsvp(1, 2, 3, 0)).rejects.toBeDefined();
  });

  test('updateUserSection is not implemented', () => {
    const tk = new Timekeeper();
    return expect(tk.updateUserSection(12, 'hobbits')).rejects.toBeDefined();
  });

  test('checks int', () => {
    expect(() => Timekeeper.requireInt(1, 'foo')).not.toThrow();
    expect(() => Timekeeper.requireInt(-1, 'foo')).not.toThrow();
    expect(() => Timekeeper.requireInt(0, 'foo')).not.toThrow();
    expect(() => Timekeeper.requireInt(undefined, 'foo')).toThrow();
    expect(() => Timekeeper.requireInt('bar', 'foo')).toThrow();
    expect(() => Timekeeper.requireInt('1', 'foo')).toThrow();
    expect(() => Timekeeper.requireInt(1.25, 'foo')).toThrow();
  });
});

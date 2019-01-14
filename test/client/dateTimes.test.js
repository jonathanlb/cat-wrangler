const dt = require('../../src/client/dateTimes');

describe('Date and time formatting', () => {
  test('Formats javascript m-d dates', () => {
    const date = new Date('2009-1-8 CST');
    const result = {};
    expect(dt.datepickerFormat(result, date)).toEqual('2009-01-08');
    expect(result.value).toEqual('2009-01-08');
  });

  test('Formats javascript mm-d dates', () => {
    const date = new Date('2009-11-08 CST');
    const result = {};
    expect(dt.datepickerFormat(result, date)).toEqual('2009-11-08');
    expect(result.value).toEqual('2009-11-08');
  });

  test('Formats javascript mm-dd dates', () => {
    const date = new Date('2009-11-18 CST');
    const result = {};
    expect(dt.datepickerFormat(result, date)).toEqual('2009-11-18');
    expect(result.value).toEqual('2009-11-18');
  });

  test('Formats javascript m-dd dates', () => {
    const date = new Date('2009-1-18 CST');
    const result = {};
    expect(dt.datepickerFormat(result, date)).toEqual('2009-01-18');
    expect(result.value).toEqual('2009-01-18');
  });

  test('Formats dates with dashes', () => {
    expect(dt.formatDate('2009-1-8')).toEqual('Thu, Jan 8, 2009');
  });

  test('Formats dates with slashes', () => {
    expect(dt.formatDate('2009/9/12')).toEqual('Sat, Sep 12, 2009');
  });

  test('Formats dates without separators', () => {
    expect(dt.formatDate('20091111')).toEqual('Wed, Nov 11, 2009');
  });

  test('Cannot format some shortened dates without separators', () => {
    expect(() => dt.formatDate('2009912')).toThrow();
  });

  test('Formats midnight', () => {
    expect(dt.formatTime('00:00')).toEqual('12:00 am');
  });

  test('Formats am times', () => {
    expect(dt.formatTime('04:00')).toEqual('4:00 am');
  });

  test('Formats shortend am times', () => {
    expect(dt.formatTime('9:13')).toEqual('9:13 am');
  });

  test('Formats pm times', () => {
    expect(dt.formatTime('14:00')).toEqual('2:00 pm');
  });
});

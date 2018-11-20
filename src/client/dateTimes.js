const DATE_RE = /^([0-9]{4})[\/\-]?([0-9]{1,2})[\/\-]?([0-9]{1,2})$/;
const TIME_RE = /^([0-9]{1,2})[:\/\-]?([0-9]{2})$/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

module.exports = {
  dtCmp: (a, b) => (`${a.yyyymmdd} ${a.hhmm}`).localeCompare(`${b.yyyymmdd} ${b.hhmm}`),

  /**
   * Format date string for printing. Avoiding Date library to avoid local
   * midnight, etc.
   */
  formatDate: (yyyymmdd) => {
    const ymdArray = yyyymmdd.match(DATE_RE);
    if (ymdArray.length !== 4) {
      throw new Error(`Cannot parse date '${yyyymmdd}'`);
    }
    const [_, yyyy, mm, dd] = ymdArray;
    const year = parseInt(yyyy, 10);
    const day = parseInt(dd, 10);
    const month = parseInt(mm, 10);
    if (month > 12 || day > 31 || month < 1 || day < 1) {
      throw new Error(`Cannot parse date '${yyyymmdd}'`);
    }
    const date = new Date(year, month - 1, day);
    return `${DAYS[date.getDay()]}, ${MONTHS[month-1]} ${day}, ${year}`;
  },

  /** Format time for printing. */
  formatTime: (hhmm) => {
    const hmAr = hhmm.match(TIME_RE);
    if (hmAr.length != 3) {
      throw new Error(`Cannot parse time from '${hhmm}'`);
    }
    const [_, hh, mm] = hmAr;
    const hour = parseInt(hh, 10);
    let hour4Str;
    if (hour == 0) {
      hour4Str = 12;
    } else if (hour < 13) {
      hour4Str = hour;
    } else {
      hour4Str = hour - 12;
    }
    return `${hour4Str}:${mm} ${hour < 12 ? 'am' : 'pm'}`;
  },
};

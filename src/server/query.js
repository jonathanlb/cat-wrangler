const q = require('./timekeeper').escapeQuotes;

module.exports = {
  simpleWhere: (query) => {
    if (!query) {
      return '';
    }

    const entries = Object.entries(query);
    if (!entries.length) {
      return '';
    }

    return `WHERE ${entries.map((e) => {
      const [key, arg] = e;
      if (key === 'id' || key.endsWith('Id')) {
        return `${key}=${parseInt(arg, 10)}`;
      }

      return `${key} LIKE '%${q(arg)}%'`;
    }).
      join(' AND ')}`;
  },
};

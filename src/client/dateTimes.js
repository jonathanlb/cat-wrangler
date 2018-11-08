module.exports = {
  dtCmp: (a, b) =>
	 (`${a.yyyymmdd} ${a.hhmm}`).localeCompare(`${b.yyyymmdd} ${b.hhmm}`)
}

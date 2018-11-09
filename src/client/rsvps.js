const dtUtils = require('./dateTimes');

module.exports = {
  /**
   * Get the highest rsvp count of any date-time option, min 1.
   * Use to normalize the response bars.
   *
   * @param dtXsums Array of date-time rsvp-summary pairs computed by
   * denormalizeDateTimeSummary.
   */
  countResponses: dtXsums => dtXsums.reduce(
    (prevMax, x) => Math.max(
      prevMax,
      Object.values(x[1]).
        reduce((sum, c) => sum + c, 0),
    ),
    1,
  ),

  /**
   * Take a rsvp summary and replace the date-time ids with date-time objects.
   *
   * @param rsvpSummary Map of date-time ids to response summaries.
   *  e.g. {"1":{"0":1,"1":2},"2":{"1":1,"-1":1},"3":{"1":3},"4":{"1":1,"-1":2},"5":{"-1":1}}
   * @return Promise of array of pairs of date-time objects and response sums.
   *  e.g. [[{id: 1, event:5, yyyymmdd: "2018-12-01" ... }, {"0":1,"1":2}], ...]
   */
  denormalizeDateTimeSummary: async (rsvpSummary, app) => Promise.all(
    Object.entries(rsvpSummary).
      map(dtXsum => app.getDateTime(dtXsum[0]).
        then(dt => [dt, dtXsum[1]])),
  ).
    then(dtXsums => dtXsums.sort(dtUtils.dtCmp)),
};

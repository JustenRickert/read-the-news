const assert = require('assert')

/**
 * TODO DemocracyNow isn't a news source in the same way as other websites.
 * Other news sources aggregate their content from a variety of sources.
 * DemocracyNow does interviews, headlines (which are like single-paragraph
 * articles without an author), and all their columns are written by the same
 * authors, Amy Goodman and Denis Moynihan.
 *
 * I don't think interviews and headlines make sense to take information from in
 * the same way as other news sources, and I think a first priority is finding
 * news source bias in general (something we don't get from content only from a
 * single author). It would still be useful to know Amy Goodman and Denis
 * Moynihan's biases, but later on.
 */

const discover = page => {
  return Promise.resolve([])
}

const collect = (page, needsContent) => {
  return Promise.resolve([])
}

module.exports = {
  discover,
  collect,
}

const assert = require('assert')

const { democracyNow } = require('../../store')

const discover = page => {
  return Promise.resolve([])
}

const collect = (page, needsContent) => {
  return Promise.resolve([])
}

module.exports = {
  discover,
  collect,
  slice: democracyNow,
}

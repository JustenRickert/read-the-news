const assert = require('assert')
const { store, theIntercept } = require('../../store')

const THE_INTERCEPT_SITE_MAP = 'https://theintercept.com/sitemap_index.xml'

const discover = async () => {
  return Promise.resolve([])
}

const collect = (page, news) => Promise.resolve([])

module.exports = {
  slice: theIntercept,
  discover,
  collect,
}

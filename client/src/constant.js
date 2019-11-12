const path = require('path')
const {
  CNN,
  FOX,
  NBC,
  NPR,
  THE_INTERCEPT,
  DEMOCRACY_NOW,
} = require('../../shared/constants')

const cwd = process.cwd()
const dataStoreFilename = path.join(cwd, 'data', 'store.json')

module.exports = {
  dataStoreFilename,
  CNN,
  FOX,
  NBC,
  NPR,
  THE_INTERCEPT,
  DEMOCRACY_NOW,
}

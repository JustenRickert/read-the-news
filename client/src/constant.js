const path = require('path')

const cwd = process.cwd()
const dataStoreFilename = path.join(cwd, 'data', 'store.json')

const CNN = 'cnn'
const FOX = 'fox'
const NBC = 'nbc'
const NPR = 'npr'

module.exports = {
  dataStoreFilename,
  CNN,
  FOX,
  NBC,
  NPR,
}

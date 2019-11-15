const path = require('path')

const cwd = process.cwd()
const dataStoreFilename = path.join(cwd, 'data', 'store.json')

module.exports = {
  dataStoreFilename,
  ...require('../../shared/constants'),
}

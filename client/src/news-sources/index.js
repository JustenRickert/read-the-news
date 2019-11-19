const { parseSite } = require('../../../shared/utils')

const newsSourceModule = name => require(`./${name}`)

const runHref = (page, href) => {
  const site = parseSite({ href })
  const { collect } = newsSourceModule(site)
  return collect(page, href)
}

module.exports = {
  runHref,
  newsSourceModule,
}

const { parseSite } = require('../../../shared/utils')

const { unique } = require('../utils')

const newsSourceModule = name => require(`./${name}`)

const collectArticle = (page, article) => {
  const href = typeof article === 'string' && article
  const site = parseSite(href ? { href } : article)
  const { collect } = newsSourceModule(site)
  return collect(page, href || article.href)
}

const discoverSite = (page, site) => {
  const { discover } = newsSourceModule(site)
  return discover(page).then(headlines => unique(headlines, ({ href }) => href))
}

module.exports = {
  collectArticle,
  discoverSite,
}

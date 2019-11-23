const { parseSite } = require('../../../shared/utils')

const newsSourceModule = name => require(`./${name}`)

const collectArticle = (page, article) => {
  const href = typeof article === 'string' && article
  const site = parseSite(href ? { href } : article)
  const { collect } = newsSourceModule(site)
  return collect(page, href || article.href)
}

const discoverSite = (page, site) => {
  const { discover } = newsSourceModule(site)
  return discover(page)
}

module.exports = {
  collectArticle,
  discoverSite,
}

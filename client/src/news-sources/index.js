const { parseSite } = require('../../../shared/utils')

const { unique } = require('../utils')

const newsSourceModule = name => require(`./${name}`)

const collectArticle = (page, article) => {
  if ('href' in article) article = article.href
  const site = parseSite(article)
  const { collect } = newsSourceModule(site)
  return collect(page, article)
}

const discoverSite = (page, site) => {
  const { discover } = newsSourceModule(site)
  return discover(page).then(headlines => unique(headlines, ({ href }) => href))
}

module.exports = {
  collectArticle,
  discoverSite,
}

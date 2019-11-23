const { parseSite } = require('../../../shared/utils')

const newsSourceModule = name => require(`./${name}`)

const collectArticle = (page, article) => {
  const href = typeof article === 'string' && article
  const site = parseSite(href ? { href } : article)
  const { collect } = newsSourceModule(site)
  return collect(page, href || article.href)
}

module.exports = {
  collectArticle,
  newsSourceModule,
}

const { parseSite } = require('../../shared/utils')

const models = require('./')

const createArticle = article => {
  const site = parseSite(article)
  return models.Article.create({ site, ...article })
    .then(result => {
      console.log('Updated', article.href)
      return { statusCode: 200, message: 'okay' }
    })
    .catch(e => {
      console.log('ERROR', article.href, e.stack)
      return { statusCode: 500, message: 'not sure what happened' }
    })
}

const upsertArticle = article => {
  const site = parseSite(article)
  const articleOrArticleUpdate = { site, ...article }
  return models.Article.upsert(articleOrArticleUpdate)
    .then(result => {
      console.log('Updated', article.href)
      return { statusCode: 200, message: 'okay' }
    })
    .catch(e => {
      console.log('ERROR', article.href, e.stack)
      return { statusCode: 500, message: 'not sure what happened' }
    })
}

module.exports = {
  createArticle,
  upsertArticle,
}

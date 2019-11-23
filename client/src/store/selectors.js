const { sample } = require('../utils')

const allArticles = (state, predicate = () => true) =>
  Object.values(state)
    .reduce(
      (articles, sliceState) => articles.concat(Object.values(sliceState)),
      []
    )
    .filter(predicate)

const randomArticle = (state, predicate = () => true) =>
  sample(allArticles(state, predicate))

module.exports = {
  allArticles,
  randomArticle,
}

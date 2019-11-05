const isFoxVideoArticle = ({ href }) => /^https:\/\/video/.test(href)

module.exports = {
  isFoxVideoArticle,
}

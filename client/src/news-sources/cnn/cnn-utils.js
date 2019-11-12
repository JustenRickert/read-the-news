const { isCnnHref } = require('../../../../shared/predicates')

const isCnnVideoArticle = ({ href }) =>
  /^https?:\/\/www\.cnn\.com\/videos/.test(href)

const isCnnStyleArticle = ({ href }) =>
  /^https?:\/\/www\.cnn\.com\/style\//.test(href)

const isCnnHeadlineHref = ({ href }) =>
  /^https?:\/\/www\.cnn\.com\/\d{4}\/\d{2}\/\d{2}\//.test(href)

const isCnnSectionHref = ({ href }) =>
  /^https?:\/\/www\.cnn\.com\/(us|world|politics|business|opinions|health|entertainment|style|travel)\/?$/.test(
    href
  )

const isCnnHeadlineArticleHref = ({ href }) =>
  /^https?:\/\/www\.cnn\.com\/(travel|style)\/article\/.*\/index\.html/.test(
    href
  )

module.exports = {
  isCnnHref,
  isCnnVideoArticle,
  isCnnStyleArticle,
  isCnnSectionHref,
  isCnnHeadlineHref,
  isCnnHeadlineArticleHref,
}

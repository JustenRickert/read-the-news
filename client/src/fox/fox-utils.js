const isFoxVideoArticle = ({ href }) => /^https:\/\/video/.test(href)

const isFoxHref = ({ href }) => /^https:\/\/www.foxnews\.com/.test(href)

const isFoxPoliticsArticleHref = ({ href }) =>
  /^https:\/\/www.foxnews\.com\/politics\/.*/.test(href)

const isFoxUsSectionHref = ({ href }) =>
  /^https:\/\/www.foxnews\.com\/us\/?$/.test(href)

const isFoxCrimeSectionHref = ({ href }) =>
  /^https:\/\/www.foxnews\.com\/category\/us\/crime\/?$/.test(href)

const isFoxHealthArticleHref = ({ href }) =>
  /^https:\/\/www.foxnews\.com\/health\/[\w\-]+\/?$/.test(href)

const isFoxLifestyleArticleHref = ({ href }) =>
  /^https:\/\/www.foxnews\.com\/lifestyle\/[\w\-]+\/?$/.test(href)

const isFoxOpinionArticleHref = ({ href }) =>
  /^https:\/\/www.foxnews\.com\/opinion\/[\w\-]+\/?$/.test(href)

const isFoxMediaArticleHref = ({ href }) =>
  /^https:\/\/www.foxnews\.com\/media\/[\w\-]+\/?$/.test(href)

const isFoxEntertainmentArticleHref = ({ href }) =>
  /^https:\/\/www.foxnews\.com\/entertainment\/[\w\-]+\/?$/.test(href)

const isFoxUsArticleHref = ({ href }) =>
  /^https:\/\/www.foxnews\.com\/(category\/)?us\/^(crime|military|education|terror|immigration|economy|personal-freedoms)+\/?$/.test(
    href
  )

module.exports = {
  isFoxVideoArticle,
  isFoxHref,
  isFoxPoliticsArticleHref,
  isFoxOpinionArticleHref,
  isFoxCrimeSectionHref,
  isFoxMediaArticleHref,
  isFoxEntertainmentArticleHref,
  isFoxHealthArticleHref,
  isFoxUsSectionHref,
  isFoxUsArticleHref,
}

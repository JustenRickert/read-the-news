const isFoxVideoArticle = ({ href }) => /^https:\/\/video/.test(href)

const isFox = ({ href }) => /^https:\/\/www.foxnews\.com/.test(href)

const isFoxPoliticsArticleHref = ({ href }) =>
  /^https:\/\/www.foxnews\.com\/politics\/.*/.test(href)

const isFoxUsSectionHref = ({ href }) =>
  /^https:\/\/www.foxnews\.com\/us\/?$/.test(href)

const isFoxHealthArticleHref = ({ href }) =>
  /^https:\/\/www.foxnews\.com\/health\/.*\/?$/.test(href)

const isFoxLifestyleArticleHref = ({ href }) =>
  /^https:\/\/www.foxnews\.com\/lifestyle\/[\w\-]+\/?$/.test(href)

const isFoxOpinionArticleHref = ({ href }) =>
  /^https:\/\/www.foxnews\.com\/opinion\/[\w\-]+\/?$/.test(href)

const isFoxMediaArticleHref = ({ href }) =>
  /^https:\/\/www.foxnews\.com\/media\/[\w\-]+\/?$/.test(href)

const isFoxEntertainmentArticleHref = ({ href }) =>
  /^https:\/\/www.foxnews\.com\/entertainment\/[\w\-]+\/?$/.test(href)

const isFoxUsArticleHref = ({ href }) =>
  /^https:\/\/www.foxnews\.com\/(category\/)?us\/[\w\-]+\/?$/.test(href)

module.exports = {
  isFoxVideoArticle,
  isFox,
  isFoxPoliticsArticleHref,
  isFoxOpinionArticleHref,
  isFoxMediaArticleHref,
  isFoxEntertainmentArticleHref,
  isFoxHealthArticleHref,
  isFoxUsSectionHref,
  isFoxUsArticleHref,
}

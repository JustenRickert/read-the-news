const { isNbcHref } = require('../../../../shared/predicates')
const { or } = require('../../utils')

const isNbcBetterHref = href =>
  /^https?:\/\/www\.nbcnews\.com\/better/.test(href)

const isNbcFeatureNbcOutHref = href =>
  /^https?:\/\/www\.nbcnews\.com\/feature\/nbc-out/.test(href)

const isNbcBusinessArticleLink = ({ href }) =>
  /^https?:\/\/www\.nbcnews\.com\/business\/^(consumer$)/.test(href)

const isNbcFeatureArticleLink = ({ href }) =>
  /^https?:\/\/www\.nbcnews\.com\/feature\/nbc-out\/.+/.test(href)

const isNbcHealthArticleLink = ({ href }) =>
  /^https?:\/\/www\.nbcnews\.com\/health\/(health-news|womens-health)\/.+/.test(
    href
  )

const isNbcLifestyleArticleLink = ({ href }) =>
  /^https?:\/\/www\.nbcnews\.com\/better\/lifestyle\/.+/.test(href)

const isNbcNewsArticleLink = ({ href }) =>
  /^https?:\/\/www\.nbcnews\.com\/news\/.+/.test(href)

const isNbcOpinionArticleLink = ({ href }) =>
  /^https?:\/\/www\.nbcnews\.com\/think\/opinion\/.+/.test(href)

const isNbcPoliticsArticleLink = ({ href }) =>
  /^https?:\/\/www\.nbcnews\.com\/politics\/.+\/^(live-blog)\//.test(href)

const isNbcPopCultureArticleLink = ({ href }) =>
  /^https?:\/\/www\.nbcnews\.com\/pop-culture\/.+/.test(href)

const isNbcTechArticleLink = ({ href }) =>
  /^https?:\/\/www\.nbcnews\.com\/tech\/tech-news\/.+/.test(href)

const isNbcTextArticleLink = or(
  isNbcBusinessArticleLink,
  isNbcFeatureArticleLink,
  isNbcHealthArticleLink,
  isNbcLifestyleArticleLink,
  // TODO is this a real link?
  // isNbcNewsArticleLink,
  isNbcOpinionArticleLink,
  isNbcPoliticsArticleLink,
  isNbcPopCultureArticleLink,
  isNbcTechArticleLink
)

module.exports = {
  __impl: {
    isNbcBusinessArticleLink,
  },
  isNbcHref,
  isNbcBetterHref,
  isNbcFeatureNbcOutHref,
  isNbcNewsArticleLink,
  isNbcTextArticleLink,
}

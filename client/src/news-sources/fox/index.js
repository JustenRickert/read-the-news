const assert = require('assert')
const shuffle = require('lodash.shuffle')

const { FOX } = require('../../constant')
const {
  and,
  zip,
  partition,
  partitionGroups,
  sequentiallyMap,
  sample,
  range,
  unique,
} = require('../../utils')

const {
  isFoxVideoArticle,
  isFoxHref,
  isFoxPoliticsArticleHref,
  isFoxMediaArticleHref,
  isFoxCrimeSectionHref,
  isFoxEntertainmentArticleHref,
  isFoxOpinionArticleHref,
  isFoxHealthArticleHref,
  isFoxUsSectionHref,
  isFoxUsArticleHref,
} = require('./fox-utils')

const IS_DEV = process.env.NODE_ENV === 'test' || undefined
const STATIC_DATE =
  IS_DEV &&
  new Date('Thu Nov 21 2019 20:32:01 GMT-0600 (Central Standard Time)')

const FOX_URL = 'https://www.foxnews.com/'

const isHeadline = ({ href }) =>
  /^https:\/\/www.foxnews\.com\/(travel|sports|us|world|media|politics|entertainment|opinion)\/[\w\-]+\/?$/.test(
    href
  )

const discover = async page => {
  const sections = await page
    .$$eval('.footer-upper.section-nav a[href]', links =>
      links.map(l => ({ href: l.href }))
    )
    .then(sections => sections.filter(isFoxHref))
  const headlines = await sequentiallyMap(
    sections.concat({ href: FOX_URL }),
    async section => {
      await page.goto(section.href)
      const headlines = await page
        .$$eval('a[href]', links => links.map(l => ({ href: l.href })))
        .then(links => links.filter(isFoxHref))
      const [validHeadlines, notHeadlines] = partition(headlines, isHeadline)
      return validHeadlines
    }
  ).then(headlines => unique(headlines, ({ href }) => href))
  console.log('Found', headlines.length, 'headlines')
  return headlines
}

const articleParagraphs = async page =>
  page.$$eval('.article-body > p', articles =>
    articles
      .filter($article => {
        if (
          $article.querySelector('strong') &&
          /^WATCH:/.test($article.textContent)
        )
          return false
        // These are ads that link to fox news articles unrelated to the current
        // article. They seem to be generated with a random order, which is
        // annoying...
        if (
          [['strong', 'a'], ['a', 'strong'], ['u', 'strong', 'a']].some(
            selectorOrder => $article.querySelector(selectorOrder.join(' '))
          )
        )
          return false
        // Filter out the "so-and-so contributed to this story" that appears
        // sometimes
        if (
          [/<i>.*<\/i>/, /<em>.*<\/em>/].some(surroundingTag =>
            surroundingTag.test($article.innerHTML)
          )
        )
          return false
        return true
      })
      .map($article => $article.textContent.trim())
      .filter(Boolean)
  )

const parseTimeAgo = relativeDate => {
  const hoursResult = /(\w+) (day|min|hour)s? ago/.exec(relativeDate)
  if (hoursResult) {
    const [, units, type] = hoursResult
    return { units, type }
  }
  return null
}

const parseDatetime = datetime => {
  if (/(\w+) (\d+)/.test(datetime)) {
    const date = STATIC_DATE || new Date(datetime)
    const currentYear = 1900 + (STATIC_DATE || new Date()).getYear()
    date.setYear(currentYear)
    return date
  }
  return null
}

const parseRelativeDate = unknownTimeFormat => {
  let date = STATIC_DATE || new Date()
  const ago = parseTimeAgo(unknownTimeFormat)
  if (ago) {
    switch (ago.type) {
      case 'day':
        date.setHours(date.getHours() - 24 * Number(ago.units))
        break
      case 'min':
        date.setMinutes(date.getMinutes() - 60 * Number(ago.units))
        break
      case 'hour':
        date.setHours(date.getHours() - Number(ago.units))
        break
    }
  }
  const datetime = parseDatetime(unknownTimeFormat)
  if (datetime) {
    date = datetime
  }
  assert(ago || datetime, 'publicationDate needs to be parsed for this article')
  return date.toString()
}

const collect = async (page, href) => {
  await page.goto(href)
  const title = await page.$eval(
    'header .headline',
    headline => headline.innerText
  )
  const authors = await page.$$eval(
    '.author-byline a[href^="/person/"]',
    links =>
      links.map(l => ({
        href: l.href,
        name: l.innerText,
      }))
  )
  const content = await articleParagraphs(page)
  const relativePublicationDate = await page.$eval('time', time =>
    time.innerHTML.trim()
  )
  return {
    href,
    authors,
    title,
    content: content.join('\n'),
    publicationDate: parseRelativeDate(relativePublicationDate),
  }
}

module.exports = {
  discover,
  collect,
}

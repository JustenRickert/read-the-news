const assert = require('assert')
const shuffle = require('lodash.shuffle')

const { store, saveStore, fox } = require('../../store')

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
      .filter(article => {
        // These are ads that link to fox news articles unrelated to the current
        // article. They seem to be generated with a random order, which is
        // annoying...
        return ![['strong', 'a'], ['a', 'strong'], ['u', 'strong', 'a']].some(
          selectorOrder => article.querySelector(selectorOrder.join(' '))
        )
      })
      // Filter out the "so-and-so contributed to this story" that appears
      // sometimes
      .filter(
        article =>
          ![/<i>.*<\/i>/, /<em>.*<\/em>/].some(surroundingTag =>
            surroundingTag.test(article.innerHTML)
          )
      )
      .map(article => article.innerText)
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
    const date = new Date(datetime)
    const currentYear = 1900 + new Date().getYear()
    date.setYear(currentYear)
    return date
  }
  return null
}

const parseRelativeDate = unknownTimeFormat => {
  let date = new Date()
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

const articleContent = async page => {
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
    href: page.url(),
    authors,
    title,
    content: content.join('\n'),
    publicationDate: parseRelativeDate(relativePublicationDate),
  }
}

const collect = (page, needsContent) =>
  sequentiallyMap(shuffle(needsContent), async article => {
    const pageResult = await page
      .goto(article.href)
      .then(() => ({ error: false }))
      .catch(e => {
        console.log(article.href, 'failed to load')
        return { error: true, msg: e.stack }
      })
    if (pageResult.error) return
    return articleContent(page).catch(
      e => (
        console.error(article.href),
        console.error(e),
        { href: article.href, error: true }
      )
    )
  }).then(articles => articles.filter(Boolean))

const run = async puppeteerBrowser => {
  const page = await puppeteerBrowser.newPage()

  await page.goto(FOX_URL)
  const headlines = await discover(page)
  store.dispatch(fox.addHeadline(headlines))
  saveStore(store)

  const needsContent = fox.selectArticlesWithoutContent(store.getState())
  console.log('Searching thru', needsContent.length, 'articles')
  await collect(page, needsContent)
    .then(fox.updateArticle)
    .then(store.dispatch)
    .catch(console.error)

  await page.close()
}

module.exports = {
  discover,
  collect,
  slice: fox,
}

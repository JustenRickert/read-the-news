const assert = require('assert')
const puppeteer = require('puppeteer')

const { makeArticlesWithoutContentSelector } = require('../store/selectors')
const { store, saveStore, fox } = require('../store')

const { FOX } = require('../constant')
const {
  and,
  zip,
  partitionGroups,
  sequentiallyMap,
  sample,
  range,
  unique,
} = require('../utils')

const {
  isFoxVideoArticle,
  isFox,
  isFoxPoliticsArticleHref,
  isFoxMediaArticleHref,
  isFoxCrimeSectionHref,
  isFoxEntertainmentArticleHref,
  isFoxOpinionArticleHref,
  isFoxHealthArticleHref,
  isFoxUsSectionHref,
  isFoxUsArticleHref,
} = require('./fox-news-utils')

const FOX_NEWS_URL = 'https://www.foxnews.com/'

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

const parseHoursAgo = relativeDate => {
  const result = /(\w+) hours? ago/.exec(relativeDate)
  if (!result) return null
  const [, hours] = result
  return hours
}

const parseRelativeDate = relativeDate => {
  const date = new Date()
  const hoursAgo = parseHoursAgo(relativeDate)
  assert(hoursAgo, 'Cannot parse relative date')
  if (hoursAgo) {
    date.setHours(date.getHours() - Number(hoursAgo))
  }
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

const discover = async page => {
  const headlines = await page
    .$$eval('a[href]', links => links.map(l => ({ href: l.href })))
    .then(headlines => headlines.filter(isFox))

  const {
    entertainmentArticles,
    healthArticles,
    mediaArticles,
    opinionArticles,
    politics,
    usArticles,
    usSections,

    rest,
  } = partitionGroups(headlines, {
    entertainmentArticles: isFoxEntertainmentArticleHref,
    healthArticles: isFoxHealthArticleHref,
    mediaArticles: isFoxMediaArticleHref,
    opinionArticles: isFoxOpinionArticleHref,
    politics: isFoxPoliticsArticleHref,
    usArticles: isFoxUsArticleHref,
    usSections: isFoxUsSectionHref,
  })
  console.log({ rest })
  return {
    headlines: politics
      .concat(usArticles)
      .concat(healthArticles)
      .concat(opinionArticles)
      .concat(mediaArticles)
      .concat(entertainmentArticles),
    usSection: usSections[0],
  }
}

const articlesWithoutContent = state =>
  Object.values(state[FOX]).filter(article => !article.content)

const run = () =>
  puppeteer.launch({ devtools: true }).then(async browser => {
    const page = await browser.newPage()
    await page.goto(FOX_NEWS_URL)
    const { headlines, usSection } = await discover(page)
    await page.goto(usSection.href)
    const { headlines: usSectionHeadlines } = await discover(page)
    const uniqueHeadlines = unique(
      headlines.concat(usSectionHeadlines),
      ({ href }) => href
    )
    console.log(
      'unique headlines found',
      uniqueHeadlines.length,
      '/',
      headlines.concat(usSectionHeadlines).length
    )
    store.dispatch(fox.addHeadline(uniqueHeadlines))
    const articlesToSearch = articlesWithoutContent(store.getState())
    console.log('Searching', articlesToSearch.length, 'articles for updates')
    const updates = await sequentiallyMap(articlesToSearch, async article => {
      await page.goto(article.href)
      return articleContent(page)
    })
    store.dispatch(fox.updateArticle(updates))
    saveStore(store)
    process.exit(0)
  })

module.exports = {
  run,
}

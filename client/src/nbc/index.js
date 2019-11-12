const assert = require('assert')
const shuffle = require('lodash.shuffle')

const { store, nbc } = require('../store/index')
const { NBC } = require('../constant')
const {
  complement,
  difference,
  partition,
  and,
  or,
  sequentiallyForEach,
  sequentiallyReduce,
  tap,
  unique,
} = require('../utils')

const {
  isNbcTextArticleLink,
  isNbcBetterHref,
  isNbcFeatureNbcOutHref,
  isNbcHref,
} = require('./nbc-utils')

const NBC_URL = 'https://www.nbcnews.com'

const NBC_SITEMAP_URL = 'https://www.nbcnews.com/sitemap'

const discoverThruSitemap = async page => {
  await page.goto(NBC_SITEMAP_URL)

  const sections = await page
    .$$eval('.sitemap-list a[href]', links =>
      links.map(l => ({ href: l.href }))
    )
    .then(links => links.filter(isNbcHref))

  const headlines = await sequentiallyReduce(
    sections,
    async (headlines, section) =>
      page
        .goto(section.href)
        .then(
          () =>
            page
              .$$eval('a[href]', links => links.map(l => ({ href: l.href })))
              .then(
                hs => (
                  console.log('Found', hs.length, 'on', section.href),
                  headlines.concat(hs)
                )
              ),
          e => (console.error(e), headlines)
        ),
    []
  )

  const foundHeadlines = unique(
    headlines.filter(and(isNbcHref, ({ href }) => /n\d+$/.test(href))),
    ({ href }) => href
  )

  console.log(foundHeadlines.map(({ href }) => href))
  console.log(
    'Found',
    headlines.length,
    'headlines total, and',
    foundHeadlines.length,
    'headlines to search thru'
  )

  return { headlines: foundHeadlines }
}

const maybeReplaceLocation = (str, replacement) =>
  str.replace(/^[\w, ]+—/, replacement)

const parseAuthors = text => {
  let result = /^By ([\w\- ]+) and ([\w\- ]+)/.exec(text)
  if (result) {
    const authorNames = result.slice(1)
    return authorNames.map(name => ({ name, href: null }))
  }
  result = /^By ([\w\- ]+)/.exec(text)
  if (result) {
    const authorName = result[1]
    return [{ name: authorName, href: null }]
  }
  assert(result, 'Cannot parse author')
}

const articleContent = async page => {
  const title = await page.$eval(
    '[data-test="article-hero__headline"]',
    el => el.innerText
  )
  const authors = await page
    .$eval('[data-test="byline"]', el => el.innerText)
    .then(parseAuthors)
  const publicationDate = await page
    .$eval('[data-test="timestamp__datePublished"]', el => el.dateTime)
    .then(datetime => new Date(datetime).toString())
  const content = await page
    .$$eval('.endmarkEnabled', els => els.map(el => el.innerText))
    .then(paragraphs =>
      [maybeReplaceLocation(paragraphs[0], '')].concat(paragraphs.slice(1))
    )
    .then(content => content.join('\n'))
  return {
    href: page.url(),
    title,
    authors,
    publicationDate,
    content,
  }
}

const articlesWithoutContent = state =>
  Object.values(state[NBC]).filter(
    headline => !headline.content && !headline.error
  )

const run = async puppeteerBrowser => {
  const page = await puppeteerBrowser.newPage()
  await page.setDefaultTimeout(100e3)

  const { headlines } = await discoverThruSitemap(page)
  store.dispatch(nbc.addHeadline(headlines))

  const needsContent = nbc.selectArticlesWithoutContent(store.getState())
  console.log('searching thru', needsContent.length)
  await sequentiallyForEach(shuffle(needsContent), async headline => {
    const { error } = await page
      .goto(headline.href)
      .then(() => ({ error: false }))
      .catch(e => {
        console.log(headline.href)
        console.error(e)
        return { error: true }
      })
    if (error) return
    console.log('Looking at', headline.href)
    return articleContent(page)
      .catch(
        e => (
          console.error(headline.href),
          console.error(e),
          { href: headline.href, error: true }
        )
      )
      .then(nbc.updateArticle)
      .then(store.dispatch)
      .catch(console.error)
  }).catch(console.error)

  await page.close()
}
module.exports = {
  run,
}

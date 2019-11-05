const assert = require('assert')
const puppeteer = require('puppeteer')

const { store, saveStore, nbc } = require('../store/index')
const { NBC } = require('../constant')
const {
  complement,
  difference,
  partition,
  and,
  or,
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

const articleContent = async page => {
  const title = await page.$eval(
    '[data-test="article-hero__headline"]',
    el => el.innerText
  )
  const authors = await page
    .$eval('[data-test="byline"]', el => el.innerText)
    .then(parseAuthors)
  const timestamp = await page
    .$eval('[data-test="timestamp__datePublished"]', el => el.dateTime)
    .then(datetime => new Date(datetime).toString())
  const content = await page
    .$$eval('.endmarkEnabled', els => els.map(el => el.innerText))
    .then(paragraphs =>
      [maybeReplaceLocation(paragraphs[0], '')].concat(paragraphs.slice(1))
    )
  return {
    href: headline.href,
    title,
    authors,
    timestamp,
    content,
  }
}

const parseAuthors = text => {
  let result = /^By ([\w\- ]+) and ([\w\- ]+)/.exec(text)
  if (result) {
    const authorNames = result.slice(1)
    return authorNames.map(name => ({ name, href: null }))
  }
  result = /^By ([\w\- ]+)/.exec(text)
  if (result) {
    const authorName = result[1]
    return { name: authorName, href: null }
  }
  assert(result, 'Cannot parse author')
}

const articlesWithoutContent = state =>
  Object.values(state[NBC]).filter(headline => !headline.content)

puppeteer.launch({ devtools: true }).then(async browser => {
  const page = await browser.newPage()
  // TODO(maybe) NBC is _sometimes_ slow (Especially `/business`)... handle
  // timeouts better in the future?
  await page.setDefaultTimeout(100e3)

  const { headlines } = await discoverThruSitemap(page)
  store.dispatch(nbc.addHeadline(headlines))
  saveStore()

  const needsContent = articlesWithoutContent(store.getState())
  console.log('searching thru', needsContent.length)
  sequentiallyReduce(needsContent, async (_, headline) => {
    await page.goto(headline.href)
    return articleContent(page)
      .catch(e => ({ error: true, message: e.stack }))
      .then(nbc.updateArticle)
      .then(update => store.dispatch(update))
      .catch(e => console.error(e))
  })
})

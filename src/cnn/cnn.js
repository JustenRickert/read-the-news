const puppeteer = require('puppeteer')

const { store, saveStore, cnn } = require('../store/index')
const { CNN } = require('../constant')
const {
  complement,
  partition,
  partitionGroups,
  sample,
  or,
} = require('../utils')

const {
  isCnnHeadlineArticleHref,
  isCnnHref,
  isCnnVideoArticle,
  isCnnStyleArticle,
  isCnnHeadlineHref,
  isCnnSectionHref,
} = require('./cnn-utils')

const CNN_URL = 'https://www.cnn.com'
const SITE_MAP_URL = 'https://www.cnn.com/sitemap.html'

const articleContentUpdates = async page => {
  const title = await page.$eval('h1.pg-headline', title => title.innerHTML)
  const authors = await page.$eval(
    '.metadata .metadata__byline__author',
    authors => authors.innerHTML
  )
  const timestamp = await page.$eval(
    '.metadata .update-time',
    timestamp => timestamp.innerText
  )
  const content = await page.$eval('[data-zn-id="body-text"]', body => {
    const ps = body.querySelectorAll('.zn-body__paragraph')
    return (
      Array.from(ps)
        // This is an advertisement...
        .filter(p => !/^<a href=.*<\/a>$/.test(p.innerHTML))
        .map(p => p.innerText)
    )
  })
  return {
    title,
    authors,
    timestamp,
    content: [content[0].slice(5)].concat(content.slice(1)).join('\n'),
  }
}

// Doing this is infinitely better than trying to discover content thru the
// website the old-fashioned way! :D
const discoverThruSitemap = async page => {
  await page.goto(SITE_MAP_URL)
  await page.click('a[href="/article/sitemap-2019.html"]')
  const monthHandles = await page
    .waitForSelector('.sitemap-month')
    .then(handle => handle.$$('a[href]'))
  return monthHandles[monthHandles.length - 1]
    .click()
    .then(() => page.waitForNavigation())
    .then(() =>
      page.$$eval('.sitemap-link a[href]', links =>
        links.map(l => ({ href: l.href }))
      )
    )
}

const run = () =>
  puppeteer.launch({ devtools: true }).then(async browser => {
    const page = await browser.newPage()
    // CNN is really slow... TODO(maybe) skip hrefs that take a really long
    // time.
    await page.setDefaultTimeout(100e3)
    const articleHeadlines = await discoverThruSitemap(page)
    store.dispatch(cnn.addHeadline(articleHeadlines))
    const randomArticle = sample(articleHeadlines)
    // TODO start collecting article content
    saveStore(store)
    process.exit(0)
  })

module.exports = {
  run,
}

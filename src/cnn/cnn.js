const assert = require('assert')
const puppeteer = require('puppeteer')
const shuffle = require('lodash.shuffle')

const { store, saveStore, cnn } = require('../store/index')
const { CNN } = require('../constant')
const {
  complement,
  partition,
  partitionGroups,
  sample,
  sequentiallyMap,
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

const parseAuthorInformation = authors => {
  const author = authors[0]
  let result = /Opinion by ([\w\-. ]+)/.exec(author)
  if (result) {
    const [, name] = result
    return [{ href: null, name }]
  }
  result = /By ([\w\- ]+),?[\w\- ]*/.exec(author)
  if (result) {
    let [, name] = result
    if (/\w+ and \w+/.test(name)) {
      return name.split(' and ').map(name => ({ href: null, name }))
    }
    return [{ href: null, name }]
  }
  assert(false, 'Could not get authors information')
}

const parsePublicationDateInformation = timestamp => {
  const result = /Updated ([\w: ]+), ([\w ,]+)/.exec(timestamp)
  if (result) {
    const [, hourStamp, dateStamp] = result
    return new Date(dateStamp).toString()
  }
  assert(false, 'Could not get publicationDate information')
}

const articleContentsBodyParagraphsEvalFunction = body => {
  const ps = body.querySelectorAll('.zn-body__paragraph')
  return (
    Array.from(ps)
      // This is an advertisement...
      .filter(p => !/^<a href=.*<\/a>$/.test(p.innerHTML))
      // preceding editor's not unrelated to the content
      .filter(p => !/^<q class="el-editorial-note">.*<\/q>$/.test(p.innerHTML))
      // footer is on some pages, unrelated content
      .filter(p => !p.classList.contains('zn-body__footer'))
      .map(p => p.innerText.replace(/^[\w ]*\(CNN\)/, ''))
  )
}

const articleContentUpdates = async page => {
  const title = await page.$eval('h1.pg-headline', title => title.innerText)
  const authors = await page
    .$$eval('.metadata__byline__author', authors =>
      authors.map(author => author.innerText)
    )
    .then(parseAuthorInformation)
  const publicationDate = await page
    .$eval('.update-time', timestamp => timestamp.innerText)
    .then(parsePublicationDateInformation)
  const content = await page.$eval(
    '[data-zn-id="body-text"]',
    articleContentsBodyParagraphsEvalFunction
  )
  // TODO more content!
  // console.log(content)
  // console.log(authors)
  // console.log(publicationDate)
  // console.log(title)
  return {
    href: page.url(),
    title,
    authors,
    publicationDate,
    content: content.join('\n'),
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

const articlesWithoutContent = state =>
  Object.values(state[CNN]).filter(({ content }) => !content)

const run = () =>
  puppeteer.launch().then(async browser => {
    const page = await browser.newPage()
    // CNN is really slow... TODO(maybe) skip hrefs that take a really long
    // time.
    await page.setDefaultTimeout(130e3)
    const articleHeadlines = await discoverThruSitemap(page)
    store.dispatch(cnn.addHeadline(articleHeadlines))
    await sequentiallyMap(
      shuffle(articlesWithoutContent(store.getState())),
      async article => {
        console.log(article.href)
        await page.goto(article.href).then(() =>
          articleContentUpdates(page)
            .catch(e => (console.error(e), { error: true }))
            .then(cnn.updateArticle)
            .then(
              action => (store.dispatch(action), saveStore(), console.log())
            )
        )
      }
    )
    saveStore()
    process.exit(0)
  })

module.exports = {
  __impl: {
    parsePublicationDateInformation,
    parseAuthorInformation,
  },
  run,
}

const assert = require('assert')
const shuffle = require('lodash.shuffle')

const { store, cnn } = require('../store/index')
const { CNN } = require('../constant')
const {
  complement,
  partition,
  partitionGroups,
  sample,
  sequentiallyForEach,
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

const collect = async (page, needsContent) =>
  await sequentiallyMap(shuffle(needsContent), article =>
    page
      .goto(article.href)
      .catch(e => (console.error(e), undefined))
      .then(() =>
        articleContentUpdates(page).catch(
          e => (
            console.error(article.href),
            console.error(e),
            { href: article.href, error: true }
          )
        )
      )
  ).then(articles => articles.filter(Boolean))

const discover = async page => {
  await page.goto(SITE_MAP_URL).catch(e => {
    console.error(SITE_MAP_URL, 'failed to load')
    throw e
  })
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

const run = async puppeteerBrowser => {
  const page = await puppeteerBrowser.newPage()
  await page.setDefaultTimeout(130e3)

  const articleHeadlines = await discover(page).catch(e => {
    console.error(e)
    return undefined
  })
  if (articleHeadlines) {
    store.dispatch(cnn.addHeadline(articleHeadlines))
  }

  await sequentiallyForEach(
    shuffle(cnn.selectArticlesWithoutContent(store.getState())),
    async article => {
      await page.goto(article.href).then(() =>
        articleContentUpdates(page)
          .catch(
            e => (
              console.error(article.href),
              console.error(e),
              { href: article.href, error: true }
            )
          )
          .then(cnn.updateArticle)
          .then(action => (store.dispatch(action), console.log()))
      )
    }
  ).catch(console.error)

  await page.close()
}

module.exports = {
  __impl: {
    parsePublicationDateInformation,
    parseAuthorInformation,
  },
  slice: cnn,
  collect,
  discover,
  run,
}

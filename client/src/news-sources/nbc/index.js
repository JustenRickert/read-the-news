const assert = require('assert')
const shuffle = require('lodash.shuffle')

const { NBC } = require('../../constant')
const {
  complement,
  difference,
  partition,
  and,
  or,
  sequentiallyMap,
  sequentiallyReduce,
  tap,
  unique,
} = require('../../utils')

const {
  isNbcTextArticleLink,
  isNbcBetterHref,
  isNbcFeatureNbcOutHref,
  isNbcHref,
} = require('./nbc-utils')

const NBC_URL = 'https://www.nbcnews.com'

const NBC_SITEMAP_URL = 'https://www.nbcnews.com/sitemap'

const discover = async page => {
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

  console.log(
    'Found',
    headlines.length,
    'headlines total, and',
    foundHeadlines.length,
    'headlines to search thru'
  )

  return foundHeadlines
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

const collect = async (page, href) => {
  await page.goto(href)
  const title = await page.$eval(
    '[data-test="article-hero__headline"]',
    el => el.innerText
  )
  const subheading = await page.$eval(
    '.articleDek',
    subheading => subheading.textContent
  )
  const authors = await page
    .$eval('[data-test="byline"]', el => el.innerText)
    .then(parseAuthors)
  const publicationDate = await page
    .$eval('[data-test="timestamp__datePublished"]', el => el.dateTime)
    .then(datetime => new Date(datetime).toString())
  const content = await page
    .$eval('.article-body__content', $content =>
      Array.from($content.childNodes)
        .filter(
          $el =>
            $el.classList.contains('endmarkEnabled') || $el.className === ''
        )
        .map($el => $el.textContent.trim())
        .filter(Boolean)
    )
    .then(paragraphs =>
      [maybeReplaceLocation(paragraphs[0], '')].concat(paragraphs.slice(1))
    )
    .then(content => content.join('\n'))
  return {
    href: page.url(),
    title,
    subheading,
    authors,
    publicationDate,
    content,
  }
}

module.exports = {
  discover,
  collect,
}

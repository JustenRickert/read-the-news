const assert = require('assert')
const shuffle = require('lodash.shuffle')

const { CNN } = require('../../constant')
const {
  complement,
  partition,
  partitionGroups,
  sample,
  sequentiallyForEach,
  sequentiallyMap,
  or,
} = require('../../utils')

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
  let result = /(opinion by|review by) ([\w\-. ]+)/i.exec(author)
  if (result) {
    const [, , name] = result
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
  return []
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
  return Array.from(ps)
}

const collect = async (page, href) => {
  await page.goto(href)
  const title = await page.$eval('h1.pg-headline', title => title.innerText)
  const authors = await page
    .$$eval('.metadata__byline__author', authors =>
      authors.map(author => author.innerText)
    )
    .then(parseAuthorInformation)
  const publicationDate = await page
    .$eval('.update-time', timestamp => timestamp.innerText)
    .then(parsePublicationDateInformation)
  const content = await page.$eval('[data-zn-id="body-text"]', $body => {
    const dropRightWhile = (xs, predicate) => {
      if (!xs.length) return xs
      if (predicate(xs[xs.length - 1]))
        return dropRightWhile(xs.slice(0, -1), predicate)
      return xs
    }
    const $ps = Array.from(
      $body.querySelectorAll('.zn-body__paragraph')
    ).filter($p => {
      if (/^<q class="el-editorial-note">.*<\/q>$/.test($p.innerHTML))
        return false
      if ($p.classList.contains('zn-body__footer')) return false
      return true
    })
    return dropRightWhile(
      $ps,
      $p =>
        (['a', 'em'].every(selector => $p.querySelector(selector)) &&
          ['to donate', 'see how to help'].some(keyword =>
            RegExp(keyword, 'i').test($p.textContent)
          )) ||
        /"([\w,.:\- ]+)" premieres ([\w. ]+) on ([\w]+)/i.test($p.textContent)
    )
      .map(p =>
        p.textContent
          .replace(/^([\w, ]*)\(cnn( business)?\)/i, (_, state) =>
            state.trim() ? `${state.trim()} — ` : ''
          )
          .trim()
      )
      .filter(Boolean)
  })
  return {
    href: page.url(),
    title,
    authors,
    publicationDate,
    content: content.join('\n'),
  }
}

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

module.exports = {
  __impl: {
    parsePublicationDateInformation,
    parseAuthorInformation,
  },
  collect,
  discover,
}

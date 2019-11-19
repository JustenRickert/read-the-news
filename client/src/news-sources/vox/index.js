const assert = require('assert')
const { store, vox } = require('../../store')
const {
  sequentiallyMap,
  unique,
  dropRightWhile,
  sequentiallyDoTimes,
  sequentiallyDoWhile,
  range,
  and,
  or,
} = require('../../utils')
const { isVoxHref } = require('../../../../shared/predicates')

const VOX_ARCHIVE_URL = 'https://www.vox.com/archives'

const voxArchiveLastNMonths = n => {
  const today = new Date()
  const year = 1900 + today.getYear()
  today.setMonth(today.getMonth() - n)
  const month = today.getMonth() + 1
  const url = `${VOX_ARCHIVE_URL}/${year}/${month}`
  return !n ? [url] : [url].concat(voxArchiveLastNMonths(n - 1))
}

const isHeadline = ({ href }) => /\d+\/\d+\/\d+\/\d+\/[\w\-]+\/?/.test(href)

const isFailingToLoad = async page =>
  page
    .$eval('body', body => /Go slow in \/archives/.test(body.textContent))
    .then(didFail => (didFail ? page.waitFor(60e3).then(() => true) : false))

const discover = page =>
  sequentiallyMap(voxArchiveLastNMonths(1), async archiveHref => {
    do {
      await page.goto(archiveHref, { waitUntil: 'networkidle0' })
    } while (await isFailingToLoad(page))
    do {
      await page
        .$('.c-archives-load-more__button')
        .then(handle => handle.click())
    } while (
      await page
        .waitForResponse(res =>
          /https:\/\/www\.vox\.com\/fetch\/archives/.test(res.url())
        )
        .then(res => res.ok())
    )
    const headlines = await page
      .$$eval('a[href]', ls => ls.map(l => ({ href: l.href })))
      .then(ls => ls.filter(and(isVoxHref, isHeadline)))
    return headlines
  })

const collectArticle = async (page, headline) => {
  await page.goto(headline.href)
  const title = await page.$eval('.c-page-title', title => title.textContent)
  const authors = await page.$eval('[data-analytics-link="author-name"]', l => [
    { href: l.href, name: l.textContent },
  ])
  const publicationDate = await page
    .$eval('time[data-ui="timestamp"]', time => time.dateTime)
    .then(datestamp => new Date(datestamp))
  const content = await page
    .$eval('.c-entry-content', contentContainer => {
      const childNodes = Array.from(contentContainer.childNodes)
      const hrIndexes = childNodes.reduce(
        (hrIndexes, node, i) =>
          node.tagName === 'HR' ? hrIndexes.concat(i) : hrIndexes,
        []
      )
      // TODO This strategy fucking blows. There's gotta be a better way
      switch (hrIndexes.length) {
        case 0:
          return childNodes.map(c => c.textContent)
        case 1:
          return childNodes.slice(0, hrIndexes[0]).map(c => c.textContent)
        case 2:
          return childNodes
            .slice(hrIndexes[0] + 1, hrIndexes[1])
            .map(c => c.textContent)
        default:
          throw new Error('case not handled ' + hrIndexes.length)
      }
    })
    .then(content =>
      dropRightWhile(
        content.map(c => c.trim()).filter(Boolean),
        or(
          p => /Listen if you like/.test(p),
          p =>
            /You can find this video and all of Vox’s videos on YouTube/.test(p)
        )
      )
        .join('\n')
        .replace(/\n+/g, '\n')
        .replace(/\s+/g, ' ')
    )
  return {
    href: headline.href,
    title,
    authors,
    publicationDate,
    content,
  }
}

const collect = (page, needsContent) =>
  sequentiallyMap(needsContent.slice(1), headline =>
    collectArticle(page, headline).catch(
      e => (
        console.error(headline.href),
        console.error(e),
        { href: headline.href, error: true }
      )
    )
  )

module.exports = {
  discover,
  collect,
  slice: vox,
}

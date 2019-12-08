const assert = require('assert')
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

const collect = async (page, href) => {
  await page.goto(href)
  const title = await page.$eval('.c-page-title', title => title.textContent)
  const authors = await page.$eval('[data-analytics-link="author-name"]', l => [
    { href: l.href, name: l.textContent },
  ])
  const publicationDate = await page
    .$eval('time[data-ui="timestamp"]', time => time.dateTime)
    .then(datestamp => new Date(datestamp))
  const subheading = await page.$eval(
    '.c-entry-summary',
    summary => summary.textContent
  )
  const content = await page
    .$eval('.c-entry-content', contentContainer => {
      const isInnerAd = href => /\/goods-newsletter\/?$/.test(href)

      return Array.from(contentContainer.childNodes)
        .filter(node => {
          if (
            ['ASIDE', 'FIGURE', 'DIV'].some(tagName => node.tagName === tagName)
          )
            return false
          const innerA = node.querySelector && node.querySelector('a')
          if (innerA) {
            if (isInnerAd(innerA.href)) return false
            const innerEM = innerA.querySelector('em')
            if (
              innerEM &&
              innerEM.textContent.toLowerCase().includes('twitter')
            )
              return false
          }
          return true
        })
        .map(node => {
          if (node.tagName === 'BLOCKQUOTE') return `“${node.textContent}”`
          return node.textContent
        })
    })
    // .then(content =>
    //   dropRightWhile(
    //     content.map(c => c.trim()).filter(Boolean),
    //     or(
    //       p => /Listen if you like/.test(p),
    //       p =>
    //         /You can find this video and all of Vox’s videos on YouTube/.test(p)
    //     )
    //   ).map(p => p.replace(/\n+/g, '\n').replace(/\s+/g, ' '))
    // )
    .then(ps =>
      ps
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => p.replace(/\n+/g, '\n').replace(/\s+/g, ' '))
    )
  return {
    href,
    title,
    subheading,
    authors,
    publicationDate,
    content: content.join('\n'),
  }
}

module.exports = {
  discover,
  collect,
}

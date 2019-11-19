const assert = require('assert')
const { store, vice } = require('../../store')
const {
  sequentiallyMap,
  unique,
  dropRightWhile,
  sequentiallyDoTimes,
  range,
} = require('../../utils')
const { isViceHref } = require('../../../../shared/predicates')

const VICE_LATEST = 'https://www.vice.com/en_us/latest'

const viceLatestPage = n => `${VICE_LATEST}?page=${n}`

const isViceHeadline = ({ href }) => /article\/\w+\/[\w\-]+\??$/.test(href)

const discover = (page, count = 30) =>
  sequentiallyMap(range(count), async n => {
    await page.goto(viceLatestPage(n + 1))
    const headlines = await page
      .$$eval('a[href]', ls => ls.map(l => ({ href: l.href })))
      .then(ls => ls.filter(isViceHref))
      .then(ls => ls.filter(isViceHeadline))
    return headlines
  }).then(headlines => unique(headlines, ({ href }) => href))

const parseDate = datestamp => {
  const result = /(\w+) (\d+) (\d+), (\d+:\d+)(\w+)/.exec(datestamp)
  assert(result, 'date must be parseable')
  const [, month, day, year, time, amOrPm] = result
  const date = new Date([year, month, day, time, amOrPm].join(' '))
  assert(datestamp.toString() !== 'Invalid Date', 'date must be valid')
  return date
}

const collectArticle = async (page, href) => {
  await page.goto(href)
  const title = await page.$eval('.heading', heading => heading.textContent)
  const authors = await page.$eval('.contributor__link', link => [
    {
      href: link.href,
      name: link.textContent,
    },
  ])
  const content = await page.$$eval('[data-type="body-text"] p', ps =>
    ps.map(p => p.textContent)
  )
  const date = await page.$eval(
    '.article-heading-v2__formatted-date',
    date => date.textContent
  )
  return {
    href,
    title,
    authors,
    content: content.join('\n'),
    publicationDate: parseDate(date),
  }
}

const collect = (page, needsContent) =>
  sequentiallyMap(needsContent, async headline =>
    collectArticle(page, headline.href).catch(
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
  slice: vice,
}

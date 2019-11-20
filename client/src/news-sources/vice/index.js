const assert = require('assert')
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

const collect = async (page, href) => {
  await page.goto(href)
  const title = await page.$eval('.heading', heading => heading.textContent)
  const subheading = await page.$eval(
    '.article-heading-v2__header-dek-wrapper h2',
    $subheading => $subheading.textContent
  )
  const authors = await page.$eval(
    '.article-heading-v2__contributors',
    $contributors =>
      Array.from($contributors.querySelectorAll('a.contributor__link')).map(
        l => ({ href: l.href, name: l.textContent })
      )
  )
  const content = await page.$eval('[data-type="body-text"]', body =>
    Array.from(body.childNodes)
      .filter(node => {
        if (!['P', 'H2', 'UL'].some(tagName => node.tagName === tagName))
          return false
        if (node.classList.contains('article__pull-quote')) return false
        if (node.querySelector('i') && node.textContent.startsWith('Cover:'))
          return false
        if (
          ['p b i a', 'p i b a', 'p a i', 'p i a'].some(selector =>
            node.querySelector(selector)
          )
        )
          return false
        if (
          node.tagName === 'P' &&
          /^<i>.*<\/i>$/.test(node.innerHTML) &&
          node.previousElementSibling &&
          node.previousElementSibling.classList.contains('article__embed')
        )
          return false
        return true
      })
      .map(p => {
        if (p.tagName === 'UL') {
          return Array.from(p.querySelectorAll('li'))
            .map(li => li.textContent.trim())
            .join('\n')
        }
        return p.textContent.trim()
      })
      .filter(Boolean)
  )
  const date = await page.$eval(
    '.article-heading-v2__formatted-date',
    date => date.textContent
  )
  return {
    href,
    title,
    subheading,
    authors,
    publicationDate: parseDate(date),
    content: content.join('\n'),
  }
}

module.exports = {
  discover,
  collect,
}

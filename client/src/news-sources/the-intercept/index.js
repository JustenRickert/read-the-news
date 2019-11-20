const assert = require('assert')
const {
  partitionGroups,
  sequentiallyMap,
  unique,
  dropRightWhile,
  sequentiallyDoTimes,
} = require('../../utils')

const THE_INTERCEPT = 'https://theintercept.com'

const isTheInterceptSection = ({ href }) =>
  /^https:\/\/theintercept\.com\/(politics|justice|national-security|world|technology|environment)\/?/.test(
    href
  )

const isTheInterceptHeadline = ({ href }) =>
  /\/\d{4}\/\d{2}\/\d{2}\/[\w\-]+\/?$/.test(href)

const discoverLinks = page =>
  page
    .$$eval('a[href]', ls =>
      ls
        .filter(l => /^https?:\/\/theintercept\.com/.test(l.href))
        .map(l => ({ href: l.href }))
    )
    .then(ls =>
      partitionGroups(ls, {
        headlines: isTheInterceptHeadline,
        sections: isTheInterceptSection,
      })
    )

const discover = async (page, sectionHref = null) => {
  await page.goto(sectionHref || THE_INTERCEPT)

  if (sectionHref) {
    await sequentiallyDoTimes(100, () =>
      page
        .evaluate(() => window.scrollBy(0, window.innerHeight))
        .then(() => page.waitFor(100))
    )
    const { headlines } = await discoverLinks(page)
    console.log('Found', headlines.length, 'headlines on', sectionHref)
    return headlines
  }

  const { headlines, sections } = await discoverLinks(page)

  return sequentiallyMap(unique(sections, ({ href }) => href), section =>
    discover(page, section.href).then(sectionHeadlines =>
      unique(headlines.concat(sectionHeadlines), ({ href }) => href)
    )
  )
}

const parseDate = date => {
  // WARNING: the last capture group has a nbsp space in it, so we have to treat
  // it differently than normal...
  const result = /(\w+) (\d+) (\d+), (\d+:\d+)(.+)/.exec(date)
  assert(result, 'Date parsing failed')
  let [, month, day, year, hourMinute, amOrPm] = result
  amOrPm = amOrPm.slice(1)
  return new Date(
    [year, month, day, hourMinute, amOrPm.replace(/\./g, '')].join(' ')
  )
}

const collect = async (page, href) => {
  await page.goto(href)
  const title = await page.$eval('h1', title => title.textContent)
  const authors = await page.$eval('.PostByline-link', byline => {
    const name = byline.querySelector('[itemprop="name"]').textContent
    const href = byline.href
    return [
      {
        name,
        href,
      },
    ]
  })
  const date = await page.$eval('.PostByline-date', date => date.innerText)
  const content = await page
    .$$eval('.PostContent div p', posts =>
      posts
        .reduce((contents, post) => {
          if (post.classList.contains('caption')) contents
          return contents.concat(post.textContent)
        }, [])
        .filter(Boolean)
    )
    .then(paragraphs =>
      dropRightWhile(paragraphs.filter(Boolean), paragraph =>
        paragraph.startsWith('Updated:')
      ).join('\n')
    )
  if (content.endsWith('Transcript coming soon.')) return undefined
  return {
    href,
    title,
    authors,
    publicationDate: parseDate(date),
    content,
  }
}

module.exports = {
  discover,
  collect,
}

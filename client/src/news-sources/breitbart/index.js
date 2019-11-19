const shuffle = require('lodash.shuffle')

const { breitbart } = require('../../store')
const { isBreitbartHref } = require('../../../../shared/predicates')
const {
  range,
  partition,
  sequentiallyMap,
  unique,
  not,
  or,
} = require('../../utils')

const BREITBART_URL = 'https://www.breitbart.com'

const BREITBART_SECTIONS = [
  `${BREITBART_URL}/politics`,
  `${BREITBART_URL}/entertainment`,
  `${BREITBART_URL}/the-media`,
  `${BREITBART_URL}/economy`,
  `${BREITBART_URL}/world-news`,
  `${BREITBART_URL}/sports`,
  `${BREITBART_URL}/social-justice`,
]

const isHeadline = ({ href }) => /\d+\/\d+\/\d+\/[\w\-]+\/?$/.test(href)

const discoverSection = (page, url) =>
  sequentiallyMap(range(3), async i => {
    await page.goto(`${url}/page/${i + 1}`)
    return await page
      .$$eval('a[href]', ls => ls.map(l => ({ href: l.href })))
      .then(ls => ls.filter(isHeadline))
  })

const discover = async page => {
  await page.goto(BREITBART_URL)
  const frontpageHeadlines = await page
    .$$eval('a[href]', ls => ls.map(l => ({ href: l.href })))
    .then(ls => ls.filter(isHeadline))
  const sectionHeadlines = await sequentiallyMap(BREITBART_SECTIONS, url =>
    discoverSection(page, url)
  )
  return frontpageHeadlines.concat(sectionHeadlines)
}

const stripInnerContents = (contents, beginningPredicate, endingPredicate) => {
  const returnContents = []
  let including = true
  contents.forEach(content => {
    if (including && beginningPredicate(content)) including = false
    if (including) returnContents.push(content)
    else if (!including && endingPredicate(content)) including = true
  })
  return returnContents
}

const collectPage = async (page, headline) => {
  await page.goto(headline.href)
  const title = await page.$eval(
    '.the-article header h1',
    title => title.textContent
  )
  const authors = await page.$eval('address a[href^="/author"]', l => [
    {
      href: l.href,
      name: l.textContent,
    },
  ])
  const publicationDate = await page
    .$eval('time[datetime]', time => time.dateTime)
    .then(datetime => new Date(datetime))
  const content = await page
    .$$eval('article.the-article p', ps =>
      ps
        .filter(
          p =>
            !['wp-caption-text', 'rmoreabt'].some(className =>
              p.classList.contains(className)
            )
        )
        .filter(p => {
          if (/^Read the full article here.$/.test(p)) return false
          if (
            p.childNodes.length === 1 &&
            ['STRONG', 'EM'].some(
              tagName => p.childNodes[0].tagName === tagName
            )
          )
            return false
          return true
        })
        .map(p => p.textContent)
    )
    .then(ps =>
      stripInnerContents(
        ps
          .map(p => p.trim())
          .filter(Boolean)
          .filter(
            not(
              or(
                p => /^Watch:$/.test(p),
                p => /^Watch the latest video at/.test(p),
                p => /^Read the full article/.test(p)
              )
            )
          ),
        p => /^Breitbart TV$/.test(p),
        p => /^click to play$/.test(p)
      )
    )
    .then(ps => ps.join('\n'))
  return {
    href: headline.href,
    title,
    content,
    publicationDate,
    authors,
  }
}

const collect = async (page, needsContent) =>
  sequentiallyMap(needsContent, headline =>
    collectPage(page, headline).catch(
      e => (
        console.error(headline.href),
        console.error(e),
        { href: headline.href, error: true }
      )
    )
  )

module.exports = {
  collect,
  discover,
  slice: breitbart,
}

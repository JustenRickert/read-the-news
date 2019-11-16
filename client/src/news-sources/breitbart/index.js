const shuffle = require('lodash.shuffle')

const { breitbart } = require('../../store')
const { isBreitbartHref } = require('../../../../shared/predicates')
const { range, partition, sequentiallyMap, unique } = require('../../utils')

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
  sequentiallyMap(range(10), async i => {
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

const collectPage = async (page, headline) => {
  await page.goto(headline.href)
  await page.waitFor(300e3)
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

const assert = require('assert')
const puppeteer = require('puppeteer')

const { store, saveStore, npr } = require('../store')
const { NPR } = require('../constant')
const {
  complement,
  or,
  partition,
  sequentiallyMap,
  unique,
  sample,
  sequentiallyDoTimes,
} = require('../utils')

const {
  isNprHealthIncHref,
  isNprHealthShotsHref,
  isNprHref,
  isNprMovieInterviewHref,
  isNprMusicVideosHref,
  isNprPodcastsHref,
  isNprPoliticsHref,
  isNprSectionsHref,
  isNprSeriesHref,
} = require('./npr-utils')

const NPR_URL = 'https://www.npr.org/sections/news/'

const parsePublicationDate = (date, time) => {
  date = /(\w+) (\w+), (\w+)/.exec(date)
  time = /(\w+):(\w+) (AM|PM) ET/.exec(time)
  assert(date && time, 'datetime must be invalid :(')
  const [, month, day, year] = date
  let [, hour, minute, amOrPm] = time
  if (amOrPm === 'PM' && hour !== '12') hour = String(Number(hour) + 12)
  else if (amOrPm === 'AM' && hour === '12') hour = String(Number(hour) - 12)
  return new Date(
    `${day} ${month} ${year} ${hour.padStart(2, '0')}:${minute}:00 EST`
  ).toString()
}

const articleContents = async page => {
  const authors = await page.$$eval('div[aria-label="Byline"]', bylines => {
    const authors = bylines.map(byline => {
      const author = byline.querySelector('p a') || byline.querySelector('p')
      return {
        href: author.href || null,
        name: author.innerText,
      }
    })
    return authors
  })
  const ps = await page.$$eval('#storytext > p', ps => {
    // TODO(maybe) use this updateTimestamp somehow
    const updatePublicationDate = ps[0].querySelector('strong')
    const paragraphs = ps.map(p => p.innerText)
    return {
      paragraphs: updatePublicationDate ? paragraphs.slice(1) : paragraphs,
    }
  })
  const title = await page.$eval('.storytitle h1', title => title.innerText)
  const timestampDate = await page.$eval('time .date', date => date.innerText)
  const timestampTime = await page.$eval('time .time', date => date.innerText)
  return {
    href: page.url(),
    title,
    publicationDate: parsePublicationDate(timestampDate, timestampTime),
    content: ps.paragraphs.join('\n'),
    authors,
  }
}

const articleSelector = url => {
  if (isNprMusicVideosHref({ href: url }))
    return 'article.item.event-more-article'
  if (
    or(isNprPoliticsHref, isNprHealthShotsHref, isNprMovieInterviewHref)({
      href: url,
    })
  )
    return '.item'
  return '.story-wrap'
}

const isHeadline = ({ href }) =>
  /^https?:\/\/www\.npr\.org\/\d{4}\/\d{2}\/\d{2}\/\d+\/[\w\-]+$/.test(href)

const maybeMoreContent = page =>
  sequentiallyDoTimes(7, () =>
    page
      .waitForSelector('.options.has-more-results button')
      .then(button => button.click())
      .then(() => page.waitFor(250))
  ).catch(() => {})

const discover = async page => {
  await page.goto(NPR_URL)
  await maybeMoreContent(page)
  const newsSectionHeadlines = await page
    .$$eval('a[href]', links => links.map(l => ({ href: l.href })))
    .then(links => links.filter(isHeadline))
  const sections = await page.$$eval('#subNavigation a[href]', links =>
    links.map(l => ({ href: l.href }))
  )
  const headlines = await sequentiallyMap(sections, async section => {
    await page.goto(section.href)
    await maybeMoreContent(page)
    return await page
      .$$eval('a[href]', links => links.map(l => ({ href: l.href })))
      .then(
        links => (
          console.log('links found', links.length, 'on', section.href), links
        )
      )
      .then(links => links.filter(isHeadline))
  })
  const uniqueLinks = unique(
    headlines.concat(newsSectionHeadlines),
    ({ href }) => href
  )
  console.log('Unique links found', uniqueLinks.length)
  return uniqueLinks
}

const articlesWithoutContent = state =>
  Object.values(state[NPR]).filter(
    article => !article.content && !article.error
  )

const run = () =>
  puppeteer.launch().then(async browser => {
    const page = await browser.newPage()

    const headlines = await discover(page)
    store.dispatch(npr.addHeadline(headlines))
    saveStore()

    const articlesToSearch = articlesWithoutContent(store.getState())
    console.log('New searches needed:', articlesToSearch.length)
    const updates = await sequentiallyMap(articlesToSearch, article =>
      page.goto(article.href).then(() =>
        articleContents(page)
          .catch(
            e => (
              console.error(article.href),
              console.error(e),
              { href: article.href, error: true }
            )
          )
          .then(npr.updateArticle)
          .then(store.dispatch)
      )
    ).catch(console.error)

    saveStore(store)
    process.exit(0)
  })

module.exports = {
  __impl: {
    parsePublicationDate,
    isHeadline,
  },
  run,
}

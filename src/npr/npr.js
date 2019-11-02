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

const NPR_URL = 'https://www.npr.org/'

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
  const timestampDate = await page.$eval('time .date', date => date.innerText)
  const timestampTime = await page.$eval('time .time', date => date.innerText)
  return {
    href: page.url(),
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

const discoverNpr = async page => {
  const homepageHeadlines = await page
    .$$eval(articleSelector(page.url()), articles =>
      articles.map(article => {
        const link = article.querySelector('a')
        const title = article.querySelector('.title')
        return {
          href: link ? link.href : article.href,
          title: title && title.innerText,
        }
      })
    )
    .then(headlines =>
      headlines.filter(
        // Don't want ads...
        isNprHref
      )
    )
  const [sections, headlines] = partition(
    homepageHeadlines,
    or(
      isNprSectionsHref,
      isNprSeriesHref,
      isNprMusicVideosHref,
      isNprPodcastsHref
    )
  )
  return { headlines, sections }
}

const articlesWithoutContent = state =>
  Object.values(state[NPR]).filter(article => !article.content)

const run = () =>
  puppeteer.launch().then(async browser => {
    const page = await browser.newPage()

    const { headlines, sections } = await page
      .goto(NPR_URL)
      .then(() => discoverNpr(page))
    const secondPassHeadlines = await sequentiallyMap(
      unique(sections, ({ href }) => href),
      async ({ href }) => {
        const { headlines, sections } = await page
          .goto(href)
          .then(() => discoverNpr(page))
        return headlines
      }
    )

    const uniqueHeadlines = unique(
      headlines.concat(secondPassHeadlines),
      ({ href }) => href
    ).filter(complement(isNprHealthIncHref))
    console.log(
      'total headlines found',
      headlines.length + secondPassHeadlines.length
    )
    console.log('total unique headlines found', uniqueHeadlines.length)
    store.dispatch(npr.addHeadline(uniqueHeadlines))

    const articlesToSearch = articlesWithoutContent(store.getState())
    console.log('New searches needed:', articlesToSearch.length)
    const updates = await sequentiallyMap(articlesToSearch, article =>
      page.goto(article.href).then(() => articleContents(page))
    )

    store.dispatch(npr.updateArticle(updates))
    saveStore(store)
    process.exit(0)
  })

module.exports = {
  __impl: {
    parsePublicationDate,
  },
  run,
}

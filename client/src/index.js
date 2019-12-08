const puppeteer = require('puppeteer')
const shuffle = require('lodash.shuffle')
const { createStore } = require('@reduxjs/toolkit')

const { parseSite } = require('../../shared/utils')
const { isBreitbartHref } = require('../../shared/predicates')

const { collectArticle, discoverSite } = require('./news-sources')

const { postArticle, fetchArticle } = require('./connection')

const {
  bucket,
  difference,
  last,
  partition,
  timeFn,
  take,
  drop,
  unique,
  sequentiallyForEach,
} = require('./utils')
const {
  reducer,
  loadFileState,
  saveStore,
  newsSourceSliceMap,
} = require('./store')
const { allArticles } = require('./store/selectors')

const runArticle = async (page, store, article, { skipPost }) => {
  const site = parseSite(article)
  const slice = newsSourceSliceMap[site]
  const result = await collectArticle(page, article).catch(
    e => (
      console.error('COLLECTION ERROR', article.href, e),
      { error: true, message: e.stack }
    )
  )
  {
    const storeDiscoveredArticles = slice.select.articles(store.getState())
    if (!storeDiscoveredArticles[result.href])
      store.dispatch(slice.actions.addHeadline(result))
  }
  store.dispatch(slice.actions.updateArticle(result))
  console.log()
  if (!skipPost && !result.error) {
    await postArticle(result, { isUpdate: true })
      .then(
        () => (
          console.log('SUCCESS:', result.href),
          console.log(result.title),
          slice.actions.markArticleSentToServer(result)
        )
      )
      .catch(
        e => (
          console.error('POST ERROR', result.href),
          slice.actions.markArticleErrorWhenSentToServer(result)
        )
      )
      .then(store.dispatch)
  }
  console.log({
    ...result,
    content: result.content && result.content.split('\n'),
  })
}

const runCollection = async (browser, store, needsContent, options) => {
  const page = await browser.newPage()
  while (needsContent.length) {
    const article = last(needsContent)
    await runArticle(page, store, article, options)
    needsContent.pop()
  }
}

const createBrowserInstanceAndRunRandomCollection = async (
  store,
  options = {},
  needsContent = allArticles(
    store.getState(),
    ({ content, sentToServer, sendToServerError }) =>
      !content && !sentToServer && !sendToServerError
  )
) => {
  const browser = await puppeteer.launch()
  await runCollection(browser, store, shuffle(needsContent), options).then(() =>
    browser.close()
  )
}

const createBrowserInstanceAndRunHref = async (store, href, options) => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await runArticle(page, store, { href }, options).then(() => browser.close())
}

// TODO better impl
const mapAsyncBatched = async (xs, asyncFn, batchSize = 100) => {
  let batch = 0
  const result = []
  while (batch * batchSize < xs.length) {
    const xsBatch = xs.slice(batch * batchSize).slice(0, batchSize)
    const ys = await Promise.all(xsBatch.map(asyncFn))
    result.push(...ys)
    batch++
  }
  return result
}

const isOnServerBatched = async (store, slice, articles) => {
  const { needsContent, alreadyOnServer } = await mapAsyncBatched(
    articles,
    article =>
      fetchArticle(article)
        .then(() => ({ type: 'ALREADY_ON_SERVER', article }))
        .catch(() => ({ type: 'NO_CONTENT', article }))
  ).then(results => {
    const [lhs, rhs] = partition(
      results,
      result => result.type === 'NO_CONTENT'
    )
    return {
      needsContent: lhs.map(r => r.article),
      alreadyOnServer: rhs.map(r => r.article),
    }
  })
  return { needsContent, alreadyOnServer }
}

const createDiscoverPage = async (site, browser) => {
  const page = await browser.newPage()
  const headlines = await discoverSite(page, site)
  await page.close()
  return headlines
}

const createBrowserInstanceAndDiscoverAll = async store => {
  const browser = await puppeteer.launch({ headless: false })
  const sites = shuffle(Object.keys(store.getState()))
  const headlinesRecord = await Promise.all(
    sites.map(
      site => (
        console.log('Starting up', site),
        createDiscoverPage(site, browser).catch(e => {
          console.error('WORK ERROR:', e.stack)
          return []
        })
      )
    )
  )
    .then(headlines => headlines.reduce((hs, xs) => hs.concat(xs), []))
    .then(headlines => bucket(headlines, headline => parseSite(headline.href)))

  const state = store.getState()

  await sequentiallyForEach(
    Object.entries(headlinesRecord),
    async ([site, headlines]) => {
      const slice = newsSourceSliceMap[site]
      store.dispatch(slice.actions.addHeadline(headlines))

      const articlesBefore = slice.select.articles(state).length
      const {
        needsContent,
        alreadyOnServer: alreadyOnServerButNotMarkedAsSuch,
      } = await isOnServerBatched(
        store,
        slice,
        difference(
          headlines,
          slice.select.articlesOnServer(state),
          ({ href }) => href
        )
      )
      store.dispatch(
        slice.actions.markArticleSentToServer(alreadyOnServerButNotMarkedAsSuch)
      )
      const articlesAfter = slice.select.articles(store.getState()).length

      console.log()
      console.log(
        'Added',
        articlesAfter - articlesBefore,
        'headlines for',
        site
      )
      console.log(
        alreadyOnServerButNotMarkedAsSuch.length,
        'marked as on server and',
        needsContent.length,
        'marked as needs content'
      )
    }
  ).catch(console.error)

  await browser.close()
}

const parseAdditionalArguments = (index, argv) =>
  argv
    .filter(Boolean)
    .slice(index)
    .reduce((options, a) => {
      switch (a) {
        case '--skip-post':
        case '--skipPost':
          return {
            ...options,
            skipPost: true,
          }
      }
    }, {})

const command = process.argv[2]

const run = store => {
  let prom = null
  switch (command) {
    case 'clean': {
      prom = Promise.resolve(undefined)
      // const articlesToBeCleaned = allArticles(store.getState())
      const bySiteRecord = bucket(articlesToBeCleaned, article =>
        parseSite(article)
      )
      const updates = Object.entries(bySiteRecord).reduce(
        (updates, [site, articles]) => {
          const slice = newsSourceSliceMap[site]
          // return updates.concat(slice.actions.clearErrors(articles))
          return updates.concat(slice.actions.markArticleSentToServer(articles))
        },
        []
      )
      console.log(updates)
      updates.forEach(store.dispatch)
      break
    }
    case 'random-discover': {
      const runDiscoverAllTimed = timeFn(createBrowserInstanceAndDiscoverAll)
      prom = runDiscoverAllTimed(store)
      break
    }
    case 'random-collect': {
      const additionalArguments = parseAdditionalArguments(3, process.argv)
      const runCollectionTimed = timeFn(
        createBrowserInstanceAndRunRandomCollection
      )
      prom = runCollectionTimed(store, additionalArguments)
      break
    }
    case 'href': {
      const href = process.argv[3]
      const additionalArguments = parseAdditionalArguments(4, process.argv)
      const runHrefTimed = timeFn(createBrowserInstanceAndRunHref)
      prom = runHrefTimed(store, href, additionalArguments)
      break
    }
    default:
      console.error("Couldn't understand arguments", command, additionalOptions)
      process.exit(1)
  }
  return prom
}

const { SKIP_SAVE } = process.env

const store = createStore(
  reducer,
  loadFileState()
  // applyMiddleware(saveContentMiddleware, logAction)
)

timeFn(run)(store).then(({ duration }) => {
  console.log('COMPLETED:', duration)
  if (!SKIP_SAVE) saveStore(store)
})

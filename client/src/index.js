const puppeteer = require('puppeteer')
const shuffle = require('lodash.shuffle')
const { createStore } = require('@reduxjs/toolkit')

const { parseSite } = require('../../shared/utils')
const { isBreitbartHref } = require('../../shared/predicates')

const { collectArticle, discoverSite } = require('./news-sources')

const { postArticle, fetchArticle } = require('./connection')

const { last, partition, timeFn, take, drop } = require('./utils')
const {
  reducer,
  loadFileState,
  saveStore,
  newsSourceSliceMap,
} = require('./store')
const { allArticles } = require('./store/selectors')

const runArticle = async (page, store, article, { skipPost = false }) => {
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
  if (!skipPost && !result.error) {
    await postArticle(result, { isUpdate: true })
      .then(
        () => (
          console.log('SUCCESS:', result.href),
          console.log(result.title),
          console.log(),
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
  console.log({ ...result, content: result.content.split('\n') })
}

const runCollection = async (browser, store, needsContent) => {
  const page = await browser.newPage()
  while (needsContent.length) {
    const article = last(needsContent)
    await runArticle(page, store, article)
    needsContent.pop()
  }
}

const createBrowserInstanceAndRunRandomCollection = async (
  store,
  needsContent = allArticles(
    store.getState(),
    ({ content, sentToServer }) => !content && !sentToServer
  )
) => {
  const browser = await puppeteer.launch()
  await runCollection(browser, store, shuffle(needsContent)).then(() =>
    browser.close()
  )
}

const createBrowserInstanceAndRunHref = async (store, href, options) => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await runArticle(page, store, { href }, options).then(() => browser.close())
}

const mapAsyncBatched = async (xs, fn, batchSize = 100) => {
  let batch = 0
  const result = []
  while (batch * batchSize < xs.length) {
    batch++
    const ys = await xs
      .slice(batch * batchSize)
      .slice(0, batchSize)
      .map(fn)
    result.push(...ys)
  }
  return result
}

const isOnServerBatched = articles => {
  const [needsContent, alreadyOnServer] = mapAsyncBatched(articles, article =>
    fetchArticle(article)
      .then(() => ({ type: 'ALREADY_ON_SERVER', article }))
      .catch(() => ({ type: 'NO_CONTENT', article }))
  ).then(results =>
    partition(results, result => result.type === 'NO_CONTENT').map((lhs, rhs) =>
      [lhs, rhs].map(result => result.article)
    )
  )
  return { needsContent, alreadyOnServer }
}

const createBrowserIstanceAndDiscoverAll = async store => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  const siteNames = shuffle(Object.keys(store.getState()))
  let site
  while ((site = siteNames.pop())) {
    const slice = newsSourceSliceMap[site]
    console.log('Discover:', slice.name)
    const headlines = await discoverSite(page, site)
      .then(headlines => {
        store.dispatch(slice.actions.addHeadline(headlines))
      })
      .catch(console.error)
    assert(typeof headlines === 'object', '')
  }
}

const parseAdditionalArguments = (index, argv) =>
  argv
    .filter(Boolean)
    .slice(index)
    .reduce((options, a) => {
      switch (a) {
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
    case 'random-discover':
      const runDiscoverAllTimed = timeFn(createBrowserIstanceAndDiscoverAll)
      prom = runDiscoverAllTimed(store)
      break
    case 'random-collect':
      const runCollectionTimed = timeFn(
        createBrowserInstanceAndRunRandomCollection
      )
      prom = runCollectionTimed(store)
      break
    case 'href':
      const href = process.argv[3]
      const additionalArguments = parseAdditionalArguments(4, process.argv)
      const runHrefTimed = timeFn(createBrowserInstanceAndRunHref)
      prom = runHrefTimed(store, href, additionalArguments)
      break
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

run(store).then(({ duration }) => {
  console.log('COMPLETED:', duration)
  if (!SKIP_SAVE) saveStore(store)
})

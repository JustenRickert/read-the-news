const puppeteer = require('puppeteer')
const shuffle = require('lodash.shuffle')
const { createStore } = require('@reduxjs/toolkit')

const { parseSite } = require('../../shared/utils')
const { isBreitbartHref } = require('../../shared/predicates')

const { collectArticle, discoverSite } = require('./news-sources')

const { postArticle, fetchArticle } = require('./connection')

// TODO reintroduce saveStore somewhere ??
const { last, timeFn } = require('./utils')
const {
  reducer,
  loadFileState,
  saveStore,
  newsSourceSliceMap,
} = require('./store')
const { allArticles } = require('./store/selectors')

const runArticle = async (page, store, article) => {
  const site = parseSite(article)
  const slice = newsSourceSliceMap[site]
  const result = await collectArticle(page, article).catch(
    e => (
      console.error('COLLECTION ERROR', article.href, e),
      { error: true, message: e.stack }
    )
  )
  store.dispatch(slice.actions.updateArticle(result))
  if (!result.error) {
    await postArticle(result)
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

const createBrowserInstanceAndRunHref = async (store, href) => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await runArticle(page, store, { href }).then(() => browser.close())
}

const createBrowserIstanceAndDiscoverAll = async store => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  const siteNames = shuffle(Object.keys(store.getState()))
  while (siteNames.length) {
    const site = last(siteNames)
    const slice = newsSourceSliceMap[site]
    await discoverSite(page, site)
      .then(headlines => {
        store.dispatch(slice.actions.addHeadline(headlines))
      })
      .catch(console.error)
    siteNames.pop()
  }
}

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
      const runHrefTimed = timeFn(createBrowserInstanceAndRunHref)
      prom = runHrefTimed(store, href)
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

run(store).then(() => {
  if (!SKIP_SAVE) saveStore(store)
})

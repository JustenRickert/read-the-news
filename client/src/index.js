const puppeteer = require('puppeteer')
const shuffle = require('lodash.shuffle')
const { createStore } = require('@reduxjs/toolkit')

const { parseSite } = require('../../shared/utils')
const { isBreitbartHref } = require('../../shared/predicates')

const { newsSourceModule, collectArticle } = require('./news-sources')

const { postArticle } = require('./connection')

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
          console.error('POST ERROR', result.href, e),
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

const command = process.argv[2]

const additionalOptions = process.argv.slice(4).reduce((options, flag) => {
  switch (flag) {
    case '--skip-discover':
      options.skipDiscover = true
      break
    case '--skip-server-post':
      options.skipServerPost = true
      break
    case '--skip-collect':
      options.skipCollect = true
      break
    case '--skip-save':
      options.skipSave = true
      break
  }
  return options
}, {})

const store = createStore(
  reducer,
  loadFileState()
  // applyMiddleware(saveContentMiddleware, logAction)
)

const saveStoreTimed = timeFn(saveStore)
const runCollectionTimed = timeFn(createBrowserInstanceAndRunRandomCollection)
const runHrefTimed = timeFn(createBrowserInstanceAndRunHref)

switch (command) {
  case 'random-discover':
    throw new Error('TODO')
    break
  case 'random-collect':
    runCollectionTimed(store)
    break
  case 'href':
    const href = process.argv[3]
    runHrefTimed(store, href)
    break
  default:
    console.error(
      "Couldn't understand arguments",
      command,
      newsSource,
      additionalOptions
    )
    process.exit(1)
}

const assert = require('assert')
const puppeteer = require('puppeteer')

const { store, saveStore } = require('./store')
const { FOX, NPR, CNN, NBC, dataStoreFilename } = require('./constant')
const {
  sequentiallyForEach,
  sequentiallyDoWhile,
  timeFn,
  partition,
} = require('./utils')
const { fetchArticle, postArticle } = require('./connection')

const withoutContentOnServerBatched = async (slice, headlines, count = 100) => {
  const needsContentFromServer = []
  let batches = 0
  while (batches * count < headlines.length) {
    const needsContentFromServerBatch = await Promise.all(
      headlines.slice(batches * count, (batches + 1) * count).map(headline =>
        fetchArticle(slice.name, headline)
          .then(() => undefined)
          .catch(() => headline)
      )
    ).then(maybeHeadlines => maybeHeadlines.filter(Boolean))
    needsContentFromServer.push(...needsContentFromServerBatch)
    batches++
  }
  return needsContentFromServer
}

const postArticlesToServerBatched = (slice, { getState }, count = 100) =>
  Promise.all(
    slice.select
      .articlesOkayForServer(getState())
      .slice(0, count)
      .map(article =>
        postArticle(slice.name, article)
          .then(() => ({
            sendToServerError: false,
            article,
          }))
          .catch(() => ({
            sendToServerError: true,
            article,
          }))
      )
  )

const runPostArticlesToServer = (slice, store) =>
  sequentiallyDoWhile(
    () => {
      const needsToBeSentToServer = slice.select.articlesOkayForServer(
        store.getState()
      )
      return needsToBeSentToServer.length
    },
    async () => {
      const [
        articlesErroringWhenSentToServer,
        articles,
      ] = await postArticlesToServerBatched(slice, store).then(results =>
        partition(results, result => result.sendToServerError)
      )
      store.dispatch(
        slice.actions.markArticleSentToServer(
          articles.map(({ article }) => article)
        )
      )
      store.dispatch(
        slice.actions.markArticleErrorWhenSentToServer(
          articlesErroringWhenSentToServer.map(({ article }) => article)
        )
      )
    }
  )

const runSingle = async (browser, module) => {
  const { discover, collect, slice } = module
  const page = await browser.newPage()

  const headlines = await discover(page).then(headlines =>
    withoutContentOnServerBatched(slice, headlines)
  )
  store.dispatch(slice.actions.addHeadline(headlines))

  const needsContent = slice.select.articlesWithoutContent(store.getState())
  await collect(page, needsContent)
    .then(slice.actions.updateArticle)
    .then(store.dispatch)
    .catch(console.error)

  await runPostArticlesToServer(slice, store)

  store.dispatch(slice.actions.removeArticlesSentToServer())
  saveStore()
}

const possibleArguments = [CNN, FOX, NBC, NPR, 'all']

const runAll = browser =>
  sequentiallyForEach(possibleArguments.slice(0, -1), name =>
    runSingle(browser, require(`./${name}`)).catch(console.error)
  )

const run = async () => {
  const newsSource = process.argv[2]

  if (!possibleArguments.some(key => newsSource === key)) {
    console.error(`News source ${newsSource} not found in data`)
    console.error('Possible values:\n ', possibleArguments.join('\n  '))
    console.log()
    process.exit(1)
  }

  const browser = await puppeteer.launch()
  let execution = null
  switch (newsSource) {
    case 'all':
      execution = runAll(browser)
      break
    default:
      execution = runSingle(browser, require(`./${newsSource}`))
      break
  }
  return execution
}

const runTimed = timeFn(run)
const saveStoreTimed = timeFn(saveStore)

runTimed()
  .then(({ duration }) => {
    console.log('Finished running everything', duration)
    saveStoreTimed().then(({ duration }) => {
      console.log('saved state', duration)
      process.exit(0)
    })
  })
  .catch(e => (console.error(e), process.exit(1)))

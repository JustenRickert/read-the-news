const assert = require('assert')
const shuffle = require('lodash.shuffle')

const {
  BREITBART,
  CNN,
  DEMOCRACY_NOW,
  FOX,
  NBC,
  NPR,
  THE_INTERCEPT,
  VICE,
  VOX,
} = require('./constant')

const { fetchArticle, postArticle } = require('./connection')

const {
  partition,
  sequentiallyDoWhile,
  sequentiallyForEach,
  timeFn,
  unique,
} = require('./utils')

const NEWS_SOURCE_COMMAND_OPTIONS = [
  BREITBART,
  CNN,
  VICE,
  // DEMOCRACY_NOW,
  FOX,
  NBC,
  NPR,
  THE_INTERCEPT,
  VOX,
  'all',
]

const withOrWithoutContentOnServerBatched = async (
  slice,
  headlines,
  count = 100
) => {
  const alreadyOnServer = []
  const contentForServer = []
  let batches = 0
  while (batches * count < headlines.length) {
    const [onServerBatch, notOnServerBatch] = await Promise.all(
      headlines.slice(batches * count, (batches + 1) * count).map(headline =>
        fetchArticle(slice.name, headline)
          .then(() => ({ isOnServer: true, headline }))
          .catch(() => ({ isOnServer: false, headline }))
      )
    )
      .then(maybeHeadlines => maybeHeadlines.filter(Boolean))
      .then(headlines => partition(headlines, headline => headline.isOnServer))
    contentForServer.push(...notOnServerBatch.map(({ headline }) => headline))
    alreadyOnServer.push(...onServerBatch.map(({ headline }) => headline))
    batches++
  }
  return { contentForServer, alreadyOnServer }
}

const postArticlesToServerBatched = (slice, { getState }, count = 100) =>
  Promise.all(
    slice.select
      .articlesOkayForServer(getState())
      .slice(0, count)
      .map(article =>
        postArticle(slice.name, article)
          .then(
            () => (
              console.log('posted', article.title, 'to server'),
              {
                sendToServerError: false,
                article,
              }
            )
          )
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

const tap = x => (console.log(x), x)

const runAllCollection = (store, puppeteerBrowserInstance, options = {}) =>
  sequentiallyForEach(shuffle(NEWS_SOURCE_COMMAND_OPTIONS.slice(0, -1)), name =>
    runSingleCollection(
      store,
      puppeteerBrowserInstance,
      require(`./news-sources/${name}`),
      options
    ).catch(console.error)
  )

const runSingleCollection = async (
  store,
  puppeteerBrowserInstance,
  module,
  options = {}
) => {
  const { discover, collect, slice } = module
  console.log('Running', slice.name)
  const page = await puppeteerBrowserInstance.newPage()

  if (!options.skipDiscover) {
    const headlines = await discover(page).then(headlines =>
      unique(headlines, ({ href }) => href)
    )
    store.dispatch(slice.actions.addHeadline(headlines))
    await withOrWithoutContentOnServerBatched(slice, headlines)
      .then(({ alreadyOnServer, contentForServer: _contentForServer }) => {
        // TODO shouldn't need to mark them actually...
        console.log('Marking', alreadyOnServer.length, 'as `sentToServer`')
        store.dispatch(slice.actions.markArticleSentToServer(alreadyOnServer))
      })
      .catch(console.error)
  }

  if (!options.skipCollect) {
    const needsContent = slice.select.articlesWithoutContent(store.getState())
    console.log('Searching thru', needsContent.length, 'articles')
    // TODO `needsContent` shouldn't be a parameter for this method. It should
    // be possible to do `goto`ing here so that it can be omitted from each
    // module's `collect` method. This would allow elevating the error-handling
    // strategy out as well. It would also allow for more direct processing
    // (`collect->post` instead of `collect[]->post[]`, and removes complicated
    // `batch` methods). Refactoring here would also provide an opportunity to
    // `unique` headlines more consistently (though maybe this should always
    // just be done in the reducer anyway...).
    await collect(page, shuffle(needsContent))
      .then(slice.actions.updateArticle)
      .then(store.dispatch)
      .catch(console.error)
  }

  if (!options.skipServerPost) {
    await runPostArticlesToServer(slice, store).catch(console.error)
  }

  if (!options.skipSave) {
    saveStore()
  }

  await page.close()
}

module.exports = {
  NEWS_SOURCE_COMMAND_OPTIONS,
  runSingleCollection,
  runAllCollection,
  runPostArticlesToServer,
}

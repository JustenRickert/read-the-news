const assert = require('assert')
const puppeteer = require('puppeteer')
const shuffle = require('lodash.shuffle')

const { store, saveStore } = require('./store')
const {
  dataStoreFilename,

  CNN,
  DEMOCRACY_NOW,
  FOX,
  NBC,
  NPR,
  THE_INTERCEPT,
  VICE,
  VOX,
} = require('./constant')
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

const runSingle = async (browser, module, commands = {}) => {
  const { discover, collect, slice } = module
  const page = await browser.newPage()

  if (!commands.skipDiscover) {
    const headlines = await discover(page)
      .then(headlines => withoutContentOnServerBatched(slice, headlines))
      .then(slice.actions.addHeadline)
      .then(store.dispatch)
      .catch(console.error)
  }

  if (!commands.skipCollect) {
    const needsContent = slice.select.articlesWithoutContent(store.getState())
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

  if (!commands.skipServerPost) {
    await runPostArticlesToServer(slice, store).catch(console.error)
  }

  if (!commands.skipSave) {
    store.dispatch(slice.actions.removeArticlesSentToServer())
    saveStore()
  }
}

const possibleArguments = [
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

const runAll = browser =>
  sequentiallyForEach(shuffle(possibleArguments.slice(0, -1)), name =>
    runSingle(browser, require(`./news-sources/${name}`)).catch(console.error)
  )

const run = async (newsSource, options = {}) => {
  const browser = await puppeteer.launch()
  let execution = null
  switch (newsSource) {
    case 'all':
      execution = runAll(browser)
      break
    default:
      execution = runSingle(
        browser,
        require(`./news-sources/${newsSource}`),
        options
      )
      break
  }
  return execution
}

const runTimed = timeFn(run)
const saveStoreTimed = timeFn(saveStore)

const command = process.argv[2]
const newsSource = process.argv[3]

const additionalOptions = process.argv.slice(4).reduce((commands, flag) => {
  switch (flag) {
    case '--skip-discover':
      commands.skipDiscover = true
      break
    case '--skip-server-post':
      commands.skipServerPost = true
      break
    case '--skip-collect':
      commands.skipCollect = true
      break
    case '--skip-save':
      commands.skipSave = true
      break
  }
  return commands
}, {})

switch (command) {
  case 'article-collection':
    if (!possibleArguments.some(key => newsSource === key)) {
      console.error(`News source ${newsSource} not found in data`)
      console.error('Possible values:\n ', possibleArguments.join('\n  '))
      console.log()
      process.exit(1)
    }
    runTimed(newsSource, additionalOptions)
      .then(({ duration }) => {
        console.log('Finished running everything', duration)
        saveStoreTimed().then(({ duration }) => {
          console.log('saved state', duration)
          process.exit(0)
        })
      })
      .catch(e => (console.error(e), process.exit(1)))
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

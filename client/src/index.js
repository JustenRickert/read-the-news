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

const newsSource = process.argv[2]

const possibleArguments = [CNN, FOX, NBC, NPR, 'all']

// if (!possibleArguments.some(key => newsSource === key)) {
//   console.error(`News source ${newsSource} not found in data`)
//   console.error('Possible values:\n ', possibleArguments.join('\n  '))
//   console.log()
//   process.exit(1)
// }

const runAll = async browser => {
  const newsSourceModules = ['./nbc', './cnn', './fox', './npr'].map(
    moduleRelativePath => ({
      name: moduleRelativePath,
      module: require(moduleRelativePath),
    })
  )
  return await sequentiallyForEach(newsSourceModules, async source => {
    assert(
      source.module.run,
      `\`run\` method needs to be exported by module ${source.name}`
    )
    await source.module.run(browser).catch(console.error)
  })
}

const tap = x => (console.log(x), x)

const withoutContentOnServerBatched = async (slice, articles, count = 100) => {
  const needsContent = []
  let batches = 0
  await sequentiallyDoWhile(
    () => batches * count < articles.length,
    async () => {
      const needsContentBatch = await Promise.all(
        articles.slice(batches * count, (batches + 1) * count).map(article =>
          fetchArticle(slice.name, article)
            .then(() => undefined)
            .catch(() => article)
        )
      ).then(maybeArticles => maybeArticles.filter(Boolean))
      needsContent.push(...needsContentBatch)
      batches++
    }
  )
  return needsContent
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
      store.dispatch(slice.actions.markArticleSentToServer(articles))
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
  saveStore()
}

const testRun = async () => {
  const browser = await puppeteer.launch({ devtools: true })
  await runSingle(browser, require('./npr'))
}

testRun()

const run = async () => {
  const browser = await puppeteer.launch()
  let execution = null
  switch (newsSource) {
    case NBC:
      execution = require('./nbc').run(browser)
      break
    case CNN:
      execution = require('./cnn').run(browser)
      break
    case FOX:
      execution = require('./fox').run(browser)
      break
    case NPR:
      execution = require('./npr').run(browser)
      break
    case 'all':
      execution = runAll(browser)
      break
  }
  return execution
}

const runTimed = timeFn(run)
const saveStoreTimed = timeFn(saveStore)

// runTimed()
//   .then(({ duration }) => {
//     console.log('Finished running everything', duration)
//     saveStoreTimed().then(({ duration }) => {
//       console.log('saved state', duration)
//       process.exit(0)
//     })
//   })
//   .catch(e => (console.error(e), process.exit(1)))

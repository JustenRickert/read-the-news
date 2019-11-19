const puppeteer = require('puppeteer')

const { parseSite } = require('../../shared/utils')

const { newsSourceModule } = require('./news-sources')

const {
  NEWS_SOURCE_COMMAND_OPTIONS,
  runSingleCollection,
  runAllCollection,
  runHref,
} = require('./commands')

// TODO reintroduce saveStore somewhere
const { reducer, loadFileState } = require('./store')

const store = createStore(
  reducer,
  loadFileState()
  // applyMiddleware(saveContentMiddleware, logAction)
)

const createBrowserInstanceAndRunHref = async href => {
  const browser = await puppeteer.launch()
  return runHref(
    store,
    browser,
    newsSourceModule(parseSite(href)),
    href,
    additionalOptions
  ).catch(e => (console.error(e), { error: true, message: e.stack }))
}

const runCollection = async (newsSource, options = {}) => {
  const browser = await puppeteer.launch()
  let execution = null
  switch (newsSource) {
    case 'all':
      execution = runAllCollection(store, browser, options)
      break
    default:
      execution = runSingleCollection(
        store,
        browser,
        newsSourceModule(newsSource),
        options
      )
      break
  }
  return execution
}

const createBrowserInstanceAndRunHref = async (href, options = {}) => {}

const runCollectionTimed = timeFn(runCollection)
const runHrefTimed = timeFn(createBrowserInstanceAndRunHref)
const saveStoreTimed = timeFn(saveStore)

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

switch (command) {
  case 'article-collection':
    const newsSource = process.argv[3]
    if (!NEWS_SOURCE_COMMAND_OPTIONS.some(key => newsSource === key)) {
      console.error(`News source ${newsSource} not found in data`)
      console.error('Possible values:\n ', possibleArguments.join('\n  '))
      console.log()
      process.exit(1)
    }
    runCollectionTimed(newsSource, additionalOptions)
      .then(({ duration }) => {
        console.log('Finished running everything', duration)
        saveStoreTimed().then(({ duration }) => {
          console.log('saved state', duration)
          process.exit(0)
        })
      })
      .catch(e => (console.error(e), process.exit(1)))
    break
  case 'href':
    const href = process.argv[3]
    runHrefTimed(store)
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

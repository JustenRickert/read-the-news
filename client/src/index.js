const assert = require('assert')
const puppeteer = require('puppeteer')

const { store, saveStore } = require('./store')
const { FOX, NPR, CNN, NBC, dataStoreFilename } = require('./constant')
const { sequentiallyForEach, timeFn } = require('./utils')
const { fetchArticle } = require('./connection')

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

const articlesWithoutContentOnServerBatched = (slice, state, count) =>
  Promise.all(
    Object.values(state[slice.name])
      .slice(0, count)
      .map(article =>
        fetchArticle(slice.name, article)
          .then(() => undefined)
          .catch(() => article)
      )
  ).then(maybeArticles => tap(maybeArticles).filter(Boolean))

const runSingle = async (browser, module) => {
  const { discover, collect, slice } = module
  // const page = await browser.newPage()
  // const headlines = await discover(page)
  // store.dispatch(slice.actions.addHeadline(headlines))
  const needsContentBatch = await articlesWithoutContentOnServerBatched(
    slice,
    store.getState(),
    100
  )
  // await collect(needsContent)
}

const testRun = async () => {
  const browser = await puppeteer.launch()
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

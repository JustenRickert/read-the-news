const assert = require('assert')
const puppeteer = require('puppeteer')

const { saveStore } = require('./store')
const { FOX, NPR, CNN, NBC, dataStoreFilename } = require('./constant')
const { sequentiallyForEach, timeFn } = require('./utils')

const newsSource = process.argv[2]

const possibleArguments = [CNN, FOX, NBC, NPR, 'all']

if (!possibleArguments.some(key => newsSource === key)) {
  console.error(`News source ${newsSource} not found in data`)
  console.error('Possible values:\n ', possibleArguments.join('\n  '))
  console.log()
  process.exit(1)
}

const runAll = async browser => {
  const newsSourceModules = ['./nbc', './cnn', './fox', './npr'].map(
    moduleRelativePath => ({
      name: moduleRelativePath,
      module: require(moduleRelativePath),
    })
  )
  return await sequentiallyForEach(newsSourceModules, async source => {
    console.log(source)
    assert(
      source.module.run,
      `\`run\` method needs to be exported by module ${source.name}`
    )
    await source.module.run(browser)
  })
}

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

runTimed()
  .then(({ duration }) => {
    console.log('Finished running everything', duration)
    saveStoreTimed().then(({ duration }) =>
      console.log('saved state', duration)
    )
  })
  .catch(e => (console.error(e), process.exit(1)))

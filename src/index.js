const { FOX, NPR, CNN, NBC, dataStoreFilename } = require('./constant')

const newsSource = process.argv[2]

const possibleArguments = [CNN, FOX, NBC, NPR]

if (!possibleArguments.some(key => newsSource === key)) {
  console.error(`News source ${newsSource} not found in data`)
  console.error('Possible values:\n ', possibleArguments.join('\n  '))
  console.log()
  throw new Error()
}

switch (newsSource) {
  case NBC:
    require('./nbc/nbc')
    break
  case CNN:
    require('./cnn/cnn')
    break
  case FOX:
    require('./fox-news/fox-news').run()
    break
  case NPR:
    require('./npr/npr').run()
    break
}

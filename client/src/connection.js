const http = require('http')
const fs = require('fs')
const { dataStoreFilename } = require('./constant')
const { sample } = require('./utils')

const PORT = 3001

const state = JSON.parse(fs.readFileSync(dataStoreFilename, 'utf-8'))

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/news-source/fox',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
}

const fetchArticle = (site, { href }) => {
  const endpoint = `http://${
    options.hostname
  }:3001/api/news-source/${site}/${encodeURIComponent(href)}`
  console.log('trying to hit endpoint', endpoint)
  return new Promise((resolve, reject) => {
    const req = http.get(endpoint, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) return reject(res)
      let data = ''
      res.on('error', console.error)
      res.on('data', chunk => (data += chunk))
      res.on('end', () => resolve(JSON.parse(data)))
    })
  })
}

// fetchArticle('fox', {
//   href:
//     'https://www.foxnews.com/media/john-kennedy-trump-nancy-pelosi-dumb-rally-',
// })
//   .then(console.log)
//   .catch(console.error)

module.exports = {
  fetchArticle,
}

// console.log(
//   Object.values(state).reduce(
//     (acc, sourceHeadlines) =>
//       acc.concat(Object.values(sourceHeadlines).filter(h => h.content)),
//     []
//   )
// )

// Object.values(state['fox']).forEach(value => {
//   const testPost = http.request(options, res => {
//     console.log('test post result', res.statusCode)
//   })

//   testPost.on('error', console.error)

//   testPost.write(JSON.stringify(value))
//   testPost.end()
// })

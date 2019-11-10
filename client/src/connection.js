const http = require('http')
const fs = require('fs')
const { dataStoreFilename } = require('./constant')
const { sample } = require('./utils')

const PORT = 3001

const state = JSON.parse(fs.readFileSync(dataStoreFilename, 'utf-8'))

// const siteEndopint = site => `http://localhost:3001/api/news-source/${site}`
// const request = http.get(siteEndopint('fox'), res => {
//   console.log('Get request result', res.statusCode)
// })
// request.on('error', console.error)
// request.end()

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/news-source/fox',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
}

const testPost = http.request(options, res => {
  console.log('test post result', res.statusCode)
})

testPost.on('error', console.error)

const testPostBody = sample(Object.values(state['fox']))

testPost.write(JSON.stringify(testPostBody))
testPost.end()

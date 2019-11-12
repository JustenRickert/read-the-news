const http = require('http')
const fs = require('fs')
const { dataStoreFilename } = require('./constant')
const { sample } = require('./utils')

const PORT = 3001

const state = JSON.parse(fs.readFileSync(dataStoreFilename, 'utf-8'))

const requestOptions = {
  hostname: 'localhost',
  port: 3001,
}

const fetchArticle = (site, { href }) => {
  const endpoint = `http://${
    requestOptions.hostname
  }:3001/api/news-source/${site}/${encodeURIComponent(href)}`
  return new Promise((resolve, reject) => {
    http.get(endpoint, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) return reject(res)
      let data = ''
      res.on('error', console.error)
      res.on('data', chunk => (data += chunk))
      res.on('end', () => resolve(JSON.parse(data)))
    })
  })
}

const postArticleOptions = {
  ...requestOptions,
  path: '/api/news-source',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
}

const postArticle = (site, article) =>
  new Promise((resolve, reject) => {
    const request = http.request(postArticleOptions, res => {
      if (res.statusCode >= 200 && res.statusCode < 300) return resolve(res)
      else reject(res)
    })
    request.on('error', console.error)
    request.write(JSON.stringify(article))
    request.end()
  })

module.exports = {
  fetchArticle,
  postArticle,
}

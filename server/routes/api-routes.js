const assert = require('assert')
const express = require('express')
const models = require('../models')
const { assertValidArticle } = require('../../shared/data-assersions')
const router = express.Router()

;[
  {
    sourceName: 'fox',
    href: 'https://www.foxnews.com/',
  },
  {
    sourceName: 'cnn',
    href: 'https://www.cnn.com/',
  },
  {
    sourceName: 'npr',
    href: 'https://www.npr.org/',
  },
  {
    sourceName: 'nbc',
    href: 'https://www.nbcnews.com/',
  },
].forEach(option => {
  models.NewsSource.create(option)
    .then(() => console.log(option.sourceName, 'created'))
    .catch(() => console.log(option.sourceName, 'already created'))
})

router.get('/news-source/:site', (req, res) => {
  models.NewsSource.findOne({ where: { sourceName: req.params.site } })
    .then(results => {
      console.log(JSON.stringify(results))
      res
        .status(200, { 'Content-Type': 'application/json' })
        .send(JSON.stringify(results))
    })
    .catch(e => {
      res.status(404).send(e.stack)
    })
})

router.post('/news-source/:site', (req, res) => {
  const payload = req.body
  models.Article.create(payload)
    .then(result => {
      console.log('Created', payload.href, payload.title)
      res.status(200).send('okay')
    })
    .catch(e => {
      console.error(e)
      console.log('Failed Payload', payload)
      res.status(400).send('Bad request')
    })
})

module.exports = router

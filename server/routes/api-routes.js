const assert = require('assert')
const express = require('express')
const { assertValidArticle } = require('../../shared/data-assersions')
const models = require('../models')
const { parseSite } = require('./utils')
const router = express.Router()

const { CNN, FOX, NBC, NPR } = require('../../shared/constants')

;[FOX, CNN, NPR, NBC].forEach(site => {
  models.NewsSource.create({ site })
    .then(() => console.log(site, 'table created'))
    .catch(() => console.log(site, 'table already created'))
})

router.get('/news-source/:site', (req, res) => {
  console.log(req.params)
  models.NewsSource.findOne({ where: { site: req.params.site } })
    .then(results => {
      console.log(JSON.stringify(results))
      res
        .status(200, { 'Content-Type': 'application/json' })
        .send(JSON.stringify(results))
    })
    .catch(e => {
      res.status(404, { 'Content-Type': 'text/plain' }).send(e.stack)
    })
})

router.get('/news-source/:site/:href', (req, res) => {
  console.log(req.params)
  models.Article.findOne({ where: { href: req.params.href } })
    .then(result => {
      res
        .status(200, { 'Content-Type': 'application/json' })
        .send(JSON.stringify(result))
    })
    .catch(e => {
      console.error(e)
      res.status(404).send()
    })
})

router.post('/news-source/:site', (req, res) => {
  const payload = req.body
  const site = parseSite(payload)
  const article = { site, ...payload }
  models.Article.create(article)
    .then(result => {
      console.log('Created', payload.href, payload.title)
      res.status(200).send('okay')
    })
    .catch(e => {
      console.error(e)
      console.log('Failed Payload', article)
      res.status(400).send('Bad request')
    })
})

module.exports = router

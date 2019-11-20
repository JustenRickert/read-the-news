const assert = require('assert')
const express = require('express')
const models = require('../models')
const { parseSite, omit } = require('./utils')
const router = express.Router()

const {
  BREITBART,
  CNN,
  // DEMOCRACY_NOW,
  FOX,
  NBC,
  NPR,
  THE_INTERCEPT,
  THE_NATION,
  VICE,
  VOX,
} = require('../../shared/constants')

;[
  BREITBART,
  CNN,
  // DEMOCRACY_NOW,
  FOX,
  NBC,
  NPR,
  THE_INTERCEPT,
  THE_NATION,
  VICE,
  VOX,
].forEach(site => {
  models.NewsSource.create({ site })
    .then(() => console.log(site, 'table created'))
    .catch(() => console.log(site, 'table already created'))
})

router.get('/news-source/:site/random', (req, res) => {
  models.Article.findOne({
    order: models.sequelize.random(),
    where: { site: req.params.site },
  })
    .then(result => {
      if (!result) return res.status(404).send()
      return res
        .status(200, { 'Content-Type': 'application/json' })
        .send(JSON.stringify(result))
    })
    .catch(e => res.status(500, { 'Content-Type': 'text/plain' }).send(e.stack))
})

router.get('/news-source/:site', (req, res) => {
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
  models.Article.findOne({
    where: { site: req.params.site, href: req.params.href },
  })
    .then(result => {
      if (!result) return res.status(404).send()
      return res
        .status(200, { 'Content-Type': 'application/json' })
        .send(
          JSON.stringify(
            omit(result.dataValues, ['createdAt', 'updatedAt', 'site'])
          )
        )
    })
    .catch(e => {
      console.error(e)
      res.status(500).send()
    })
})

router.post('/news-source', (req, res) => {
  const payload = req.body
  const site = parseSite(payload)
  const article = { site, ...payload }
  models.Article.create(article)
    .then(result => {
      console.log('Created', payload.href, payload.title)
      res.status(200).send('okay')
    })
    .catch(e => {
      console.error(e.stack)
      console.log('Failed Payload', article)
      res.status(400).send('Bad request')
    })
})

module.exports = router

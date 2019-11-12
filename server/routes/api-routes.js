const assert = require('assert')
const express = require('express')
const models = require('../models')
const { parseSite, omit } = require('./utils')
const router = express.Router()

const {
  CNN,
  DEMOCRACY_NOW,
  FOX,
  NBC,
  NPR,
  THE_INTERCEPT,
} = require('../../shared/constants')

;[CNN, DEMOCRACY_NOW, FOX, NBC, NPR, THE_INTERCEPT].forEach(site => {
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
  console.log('SITE', site)
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

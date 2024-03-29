const assert = require('assert')
const express = require('express')
const Sentiment = require('sentiment')

const { pick } = require('../../shared/utils')
const models = require('../models')
const modelActions = require('../models/actions')
const { parseSite, omit } = require('./utils')
const router = express.Router()

const sentiment = new Sentiment()

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

router.get('/news-source', (req, res) => {
  models.NewsSource.findAll({
    attributes: {
      exclude: ['createdAt', 'updatedAt'],
    },
  })
    .then(sources => res.json(sources))
    .catch(e => {
      res.status(500).send(e.stack)
    })
})

router.get('/news-source/:site', (req, res) => {
  models.NewsSource.findOne({ where: { site: req.params.site } })
    .then(results => {
      res
        .status(200, { 'Content-Type': 'application/json' })
        .send(JSON.stringify(results))
    })
    .catch(e => {
      res.status(404, { 'Content-Type': 'text/plain' }).send(e.stack)
    })
})

router.get('/news-source/:site/random/:count', (req, res) => {
  models.Article.findAll({
    order: models.sequelize.random(),
    limit: req.params.count || 1,
    where: { site: req.params.site },
    attributes: {
      exclude: ['createdAt', 'updatedAt', 'site'],
    },
  })
    .then(result => {
      if (!result) return res.status(404).send()
      return res
        .status(200, { 'Content-Type': 'application/json' })
        .send(JSON.stringify(result))
    })
    .catch(e => res.status(500, { 'Content-Type': 'text/plain' }).send(e.stack))
})

router.get('/news-source/:site/:href', (req, res) => {
  models.Article.findOne({
    where: { site: req.params.site, href: req.params.href },
  })
    .then(result => {
      if (!result) return res.status(404).send()
      return res
        .status(200)
        .json(omit(result.dataValues, ['createdAt', 'updatedAt', 'site']))
    })
    .catch(e => {
      console.error(e)
      res.status(500).send()
    })
})

router.post('/news-source/:href', (req, res) => {
  const payload = req.body
  assert(payload.href === req.params.href, '`href`s need to match')
  const site = parseSite(payload)
  const articleOrArticleUpdate = { site, ...payload }
  modelActions
    .upsertArticle(articleOrArticleUpdate)
    .then(({ statusCode, message }) => res.status(statusCode).send(message))
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
      console.log('Failed Payload', article.href)
      res.status(400).send('Bad request')
    })
})

const analyzeSentiment = articleContent => {
  const { calculation, score, tokens, comparative } = sentiment.analyze(
    articleContent
  )
  const words = Object.values(
    calculation.reduce((words, o) => {
      const [entry] = Object.entries(o)
      const [word, score] = entry
      return Object.assign(words, {
        [word]: {
          word,
          count: words[word] ? words[word].count + 1 : 1,
          score,
        },
      })
    }, {})
  ).sort((l, r) => r.count * r.score - l.count * l.score)
  return {
    score,
    comparative,
    words,
    length: tokens.length,
  }
}

router.get('/sentiment/:href', (req, res) => {
  const site = parseSite(req.params.href)
  models.Article.findOne({
    where: { site, href: req.params.href },
  })
    .then(article => {
      console.log('HIT', article.href)
      res.status(200).json(analyzeSentiment(article.content))
    })
    .catch(e => {
      console.log('FAIL??????', e.stack)
      res.status(500).send('???')
    })
})

module.exports = router

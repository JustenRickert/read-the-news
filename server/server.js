const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

const { createPuppeteerWsServer } = require('./puppeteer-server')

dotenv.config()

const db = require('./models')
const app = express()

// TODO setup without cors?
app.use(cors())

app.use(require('body-parser').text())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const routes = require('./routes')
app.use(routes)

const PORT = 3001

db.sequelize.sync().then(async () => {
  const server = app.listen(PORT, () => {
    console.log('App now listening on port:', PORT)
  })

  const wsServer = await createPuppeteerWsServer({ port: 3002, server })
})

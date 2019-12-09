const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

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

  const { createPuppeteerWsServer } = require('./puppeteer-server')
  const { createDashboardWsServer } = require('./dashboard-server')

  const puppeteerServer = await createPuppeteerWsServer({
    noServer: true,
  })

  const dashboardServer = await createDashboardWsServer({
    noServer: true,
  })

  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url.slice(1)
    switch (pathname) {
      case 'ws-dashboard':
        dashboardServer.handleUpgrade(request, socket, head, ws => {
          dashboardServer.emit('connection', ws, request)
        })
        break
      case 'ws-puppeteer':
        puppeteerServer.handleUpgrade(request, socket, head, ws => {
          puppeteerServer.emit('connection', ws, request)
        })
        break
    }
  })
})

const puppeteer = require('puppeteer')
const ws = require('ws')
const { collectArticle } = require('../client')
const modelActions = require('./models/actions')

const handleRunArticle = (socket, page, payload, { write = false } = {}) =>
  collectArticle(page, payload.message)
    .then(async article => {
      if (!write) {
        socket.send(
          JSON.stringify({
            id: payload.id,
            message: { type: 'CLIENT#COLLECT', article },
          })
        )
        return
      }
      const result = await modelActions.upsertArticle(article)
      if (result.statusCode === 200)
        socket.send(
          JSON.stringify({
            id,
            message: { type: 'UPSERT#SUCCESS', message: article },
          })
        )
      if (result.statusCode === 500)
        socket.send(
          JSON.stringify({
            id: payload.id,
            message: { type: 'UPSERT#FAIL#DB', message: null },
          })
        )
    })
    .catch(e => {
      console.error(e.stack)
      socket.send(
        JSON.stringify({
          id,
          message: { type: 'UPSERT#FAIL#COLLECT', message: null },
        })
      )
    })

const createPuppeteerWsServer = async ({ port, server }) => {
  const browser = await puppeteer.launch({ headless: false })
  const wsServer = new ws.Server({ port, server })
  wsServer.on('connection', socket => {
    console.info('Total connections:', wsServer.clients.size)
    socket.on('message', async payload => {
      payload = JSON.parse(payload)
      if (payload.message.type === 'UPDATE_HREF' && payload.message.href) {
        console.log('TRYING TO UPDATE')
        const page = await browser.newPage()
        await handleRunArticle(socket, page, payload).catch(console.error)
        await page.close()
      }
    })
    socket.on('close', message => {
      console.log({ message })
    })
  })
  return wsServer
}

module.exports = {
  createPuppeteerWsServer,
}

const puppeteer = require('puppeteer')
const ws = require('ws')
const { parseSite } = require('../shared/utils')
const { collectArticle } = require('../client')
const modelActions = require('./models/actions')

const handleRunArticle = (socket, page, payload = {}) =>
  collectArticle(page, payload.message)
    .then(async article =>
      socket.send(
        JSON.stringify({
          id: payload.id,
          context: payload.message.context,
          type: 'CLIENT#COLLECT#SUCCESS',
          message: {
            site: parseSite(payload.message.href),
            article,
          },
        })
      )
    )
    .catch(e => {
      console.error(e.stack)
      socket.send(
        JSON.stringify({
          id,
          context: payload.message.context,
          type: 'CLIENT#COLLECT#FAIL',
          message: {
            message: 'FAILURE_TO_READ_ARTICLE_ON_SITE',
            href: payload.message.href,
          },
        })
      )
    })

const createPuppeteerWsServer = async ({ port, server }) => {
  const browser = await puppeteer.launch()
  const wsServer = new ws.Server({ port, server })
  wsServer.on('connection', socket => {
    socket.on('message', async payload => {
      payload = JSON.parse(payload)
      if (payload.message.type === 'SEND#UPDATE#HREF' && payload.message.href) {
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

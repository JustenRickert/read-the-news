const puppeteer = require('puppeteer')
const ws = require('ws')
const { collectArticle } = require('../client')
const modelActions = require('./models/actions')

const handleRunArticle = (socket, href) =>
  collectArticle(href)
    .then(async article => {
      const result = modelActions.upsertArticle(article)
      if (result.statusCode === 200)
        socket.send(JSON.stringify({ type: 'UPSERT#SUCCESS', article }))
      if (result.statusCode === 500)
        socket.send(JSON.stringify({ type: 'UPSERT#FAIL#DB', href }))
    })
    .catch(e => {
      console.error(e.stack)
      socket.send(JSON.stringify({ type: 'UPSERT#FAIL#COLLECT', href }))
    })

const createPuppeteerWsServer = async ({ port, server }) => {
  const browser = await browser.launch()
  const wsServer = new ws.Server({ port: 3002, server })
  wsServer.on('connection', socket => {
    console.info('Total connections:', wsServer.clients.size)
    socket.on('message', message => {
      if (message.type === 'UPDATE' && message.href)
        handleRunArticle(socket, message.href)
      console.log({ message })
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

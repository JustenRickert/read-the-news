const express = require('express')
const newsSource = require('./api-routes')
const app = require('./app-route')
const router = express.Router()

router.use('/api', newsSource)
router.use('/', app)

router.route('/health').get((req, res) => {
  res.status(200).send('server is healthy!')
})

module.exports = router

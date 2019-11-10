const express = require('express')
const newsSource = require('./api-routes')
const router = express.Router()

router.use('/api', newsSource)

router.route('/health').get((req, res) => {
  res.status(200).send('server is healthy!')
})

module.exports = router

const express = require('express')
const path = require('path')
const router = express.Router()

const SERVER_ROOT = process.cwd()

router.use(express.static(path.join(SERVER_ROOT, '../site/build')))

router.get('*', (req, res) => {
  res.sendFile(path.join(SERVER_ROOT, '../site/build/index.html'))
})

module.exports = router

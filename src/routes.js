const express = require('express')
const router = express.Router()

router.get('/status', (req, res) => {
  res.send('Running ⚡')
})

router.use('/categories', require('./modules/category/index'))
router.use('/listings', require('./modules/listing/index'))
router.use('/filters', require('./modules/filter/index'))
router.use('/search', require('./modules/search/index'))
router.use('/auth', require('./modules/auth/index'))
router.use('/users', require('./modules/user/index'))

module.exports = router

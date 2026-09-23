'use strict'

const express = require('express')
const router = express.Router()
const SearchController = require('./controller')

router.get('/', SearchController.search)
router.get('/suggestions', SearchController.suggestions)

module.exports = router

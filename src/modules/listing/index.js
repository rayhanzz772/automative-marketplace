'use strict'

const express = require('express')
const router = express.Router()
const ListingController = require('./controller')
const SearchController = require('../search/controller')
const { createRateLimiter } = require('../../utils/helper')

router.get('/search/suggest', createRateLimiter(10), SearchController.suggestions)
router.get('/search', createRateLimiter(10), SearchController.search)

router.get('/', createRateLimiter(10), ListingController.getAll)
router.post('/', createRateLimiter(5), ListingController.create)
router.get('/:id', createRateLimiter(10), ListingController.getById)
router.patch('/:id', createRateLimiter(5), ListingController.update)
router.delete('/:id', createRateLimiter(5), ListingController.remove)

module.exports = router

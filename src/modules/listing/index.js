'use strict'

const express = require('express')
const router = express.Router()
const ListingController = require('./controller')
const SearchController = require('../search/controller')

// 4.2 Search Endpoints (mounted under /listings)
router.get('/search/suggest', SearchController.suggestions)
router.get('/search', SearchController.search)

// 4.1 Listings Endpoints
router.get('/', ListingController.getAll)
router.post('/', ListingController.create)
router.get('/:id', ListingController.getById)
router.patch('/:id', ListingController.update)
router.delete('/:id', ListingController.remove)

module.exports = router

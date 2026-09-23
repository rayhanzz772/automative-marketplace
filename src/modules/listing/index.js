'use strict'

const express = require('express')
const router = express.Router()
const ListingController = require('./controller')
const SearchController = require('../search/controller')

router.get('/search/suggest', SearchController.suggestions)
router.get('/search', SearchController.search)

router.get('/', ListingController.getAll)
router.post('/', ListingController.create)
router.get('/:id', ListingController.getById)
router.patch('/:id', ListingController.update)
router.delete('/:id', ListingController.remove)

module.exports = router

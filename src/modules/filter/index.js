'use strict'

const express = require('express')
const router = express.Router()
const FilterController = require('./controller')

// 4.2 Search & Filters API Specification
router.get('/', FilterController.getFacets)
router.get('/facets', FilterController.getFacets)
router.get('/:categoryId', FilterController.getCategoryFilters)
router.post('/attributes', FilterController.createAttribute)
router.delete('/attributes/:id', FilterController.deleteAttribute)

module.exports = router

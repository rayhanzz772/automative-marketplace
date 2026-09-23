'use strict'

const express = require('express')
const router = express.Router()
const FilterController = require('./controller')

router.get('/facets', FilterController.getFacets)
router.get('/category/:categoryId', FilterController.getCategoryFilters)
router.post('/attributes', FilterController.createAttribute)
router.delete('/attributes/:id', FilterController.deleteAttribute)

module.exports = router

'use strict'

const express = require('express')
const router = express.Router()
const FilterController = require('./controller')

router.get('/', FilterController.getFacets)
router.get('/:categoryId', FilterController.getCategoryFilters)

module.exports = router

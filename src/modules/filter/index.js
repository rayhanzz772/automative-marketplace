'use strict'

const express = require('express')
const router = express.Router()
const FilterController = require('./controller')
const { createRateLimiter } = require('../../utils/helper')

router.get('/', createRateLimiter(10), FilterController.getFacets)
router.get('/:categoryId', createRateLimiter(10), FilterController.getCategoryFilters)

module.exports = router

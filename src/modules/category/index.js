'use strict'

const express = require('express')
const router = express.Router()
const CategoryController = require('./controller')
const { createRateLimiter } = require('../../utils/helper')

router.get('/', createRateLimiter(10), CategoryController.getTree)
router.post('/', createRateLimiter(5), CategoryController.create)
router.get('/:id', createRateLimiter(10), CategoryController.getById)
router.get('/:id/listings', createRateLimiter(10), CategoryController.getListings)
router.get('/:id/children', createRateLimiter(10), CategoryController.getChildren)
router.get('/:id/filters', createRateLimiter(10), CategoryController.getFilters)
router.patch('/:id', createRateLimiter(5), CategoryController.update)

module.exports = router

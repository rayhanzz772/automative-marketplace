'use strict'

const express = require('express')
const router = express.Router()
const CategoryController = require('./controller')

// 4.3 Categories API Specification
router.get('/', CategoryController.getTree)
router.post('/', CategoryController.create)
router.get('/:id', CategoryController.getById)
router.get('/:id/listings', CategoryController.getListings)
router.get('/:id/children', CategoryController.getChildren)
router.get('/:id/filters', CategoryController.getFilters)
router.patch('/:id', CategoryController.update)
router.delete('/:id', CategoryController.remove)

module.exports = router

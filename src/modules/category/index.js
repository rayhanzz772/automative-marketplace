'use strict'

const express = require('express')
const router = express.Router()
const CategoryController = require('./controller')

router.get('/', CategoryController.getAll)
router.post('/', CategoryController.create)
router.get('/:id', CategoryController.getById)
router.patch('/:id', CategoryController.update)
router.delete('/:id', CategoryController.remove)
router.get('/:id/children', CategoryController.getChildren)
router.get('/:id/filters', CategoryController.getFilters)

module.exports = router

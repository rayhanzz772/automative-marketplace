'use strict'

const express = require('express')
const router = express.Router()
const CategoryController = require('./controller')

router.get('/', CategoryController.getTree)
router.post('/', CategoryController.create)
router.get('/:id', CategoryController.getById)
router.get('/:id/listings', CategoryController.getListings)
router.patch('/:id', CategoryController.update)

module.exports = router

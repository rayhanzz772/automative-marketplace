'use strict'

const express = require('express')
const router = express.Router()
const ListingController = require('./controller')

router.get('/', ListingController.getAll)
router.post('/', ListingController.create)
router.get('/:id', ListingController.getById)
router.patch('/:id', ListingController.update)
router.delete('/:id', ListingController.remove)

module.exports = router

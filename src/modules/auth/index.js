const Controller = require('./controller')
const router = require('express').Router()
const authMiddleware = require('../../middleware/authMiddleware')

router.post('/login', Controller.login)
router.get('/get-me', authMiddleware, Controller.getMe)

module.exports = router

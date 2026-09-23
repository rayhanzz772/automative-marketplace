const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const db = require('../../../db/models')
const { api } = require('../../utils/api')
const { HttpStatusCode } = require('axios')

const User = db.User

class Controller {
  static async login(req, res) {
    try {
      const { username, password } = req.body

      const user = await User.findOne({
        where: {
          [db.Sequelize.Op.or]: [{ email: username }, { username: username }],
          status: true
        },
        include: [
          {
            model: db.Role,
            as: 'role'
          }
        ]
      })

      if (!user) {
        throw { code: 400, message: 'User not found' }
      }

      const isValid = await bcrypt.compare(password, user.password)

      if (!isValid) {
        throw { code: 400, message: 'Invalid Password' }
      }

      const payload = {
        userId: user.id,
        role: user.role?.code,
        status: user.status
      }

      const token = jwt.sign(payload, process.env.JWT_KEY, {
        expiresIn: '7d'
      })

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })

      const userSafe = {
        id: user.id,
        role: user.role?.name,
        status: user.status,
        createdAt: user.createdAt,
        outletId: null,
        outletCode: null
      }

      return res
        .status(HttpStatusCode.Ok)
        .json(api(userSafe, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = err?.code ?? HttpStatusCode.InternalServerError
      return res.status(code).json(api(null, code, { err }))
    }
  }

  static async logout(req, res) {
    try {
      res.clearCookie('token')
      return res
        .status(HttpStatusCode.Ok)
        .json(api(null, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = err?.code ?? HttpStatusCode.InternalServerError
      return res.status(code).json(api(null, code, { err }))
    }
  }

  static async getMe(req, res) {
    try {
      const userId = req.user.id

      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: db.Role,
            as: 'role'
          }
        ]
      })

      if (!user) throw new Error('User not found')

      const result = {
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        role: user.role
          ? {
              id: user.role.id,
              is_global_access: user.role.is_global_access,
              name: user.role.name,
              code: user.role.code
            }
          : null
      }

      return res
        .status(HttpStatusCode.Ok)
        .json(api(result, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = err?.code ?? HttpStatusCode.InternalServerError
      return res.status(code).json(api(null, code, { err }))
    }
  }
}

module.exports = Controller

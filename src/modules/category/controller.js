'use strict'

const { HttpStatusCode } = require('axios')
const cuid = require('cuid')
const { api } = require('../../utils/api')
const query = require('./query')

class CategoryController {
  /**
   * GET /api/v1/categories
   * Returns flat list of all categories (client builds tree from parent_id)
   */
  static async getAll(req, res) {
    try {
      const data = await query.getAll()
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = err?.code ?? HttpStatusCode.InternalServerError
      return res.status(code).json(api(null, code, { err }))
    }
  }

  /**
   * GET /api/v1/categories/:id
   * Returns a single category with its breadcrumb path
   */
  static async getById(req, res) {
    try {
      const data = await query.getById(req.params.id)
      if (!data) throw { code: 404, message: 'Category not found' }
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = err?.code ?? HttpStatusCode.InternalServerError
      return res.status(code).json(api(null, code, { err }))
    }
  }

  /**
   * GET /api/v1/categories/:id/children
   * Returns direct children of a category
   */
  static async getChildren(req, res) {
    try {
      const data = await query.getChildren(req.params.id)
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = err?.code ?? HttpStatusCode.InternalServerError
      return res.status(code).json(api(null, code, { err }))
    }
  }

  /**
   * GET /api/v1/categories/:id/filters
   * Returns dynamic filter attributes (with inherited attrs from ancestors)
   */
  static async getFilters(req, res) {
    try {
      const data = await query.getFiltersForCategory(req.params.id)
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = err?.code ?? HttpStatusCode.InternalServerError
      return res.status(code).json(api(null, code, { err }))
    }
  }

  /**
   * POST /api/v1/categories
   */
  static async create(req, res) {
    try {
      const { parent_id, name, slug, icon_url, sort_order } = req.body
      if (!name || !slug) throw { code: 400, message: 'name and slug are required' }

      const data = await query.create({
        id: cuid(),
        parentId: parent_id || null,
        name,
        slug,
        iconUrl: icon_url,
        sortOrder: sort_order || 0
      })

      return res.status(HttpStatusCode.Created).json(api(data, HttpStatusCode.Created, { req }))
    } catch (err) {
      const code = err?.code ?? HttpStatusCode.InternalServerError
      return res.status(code).json(api(null, code, { err }))
    }
  }

  /**
   * PATCH /api/v1/categories/:id
   */
  static async update(req, res) {
    try {
      const data = await query.update(req.params.id, req.body)
      if (!data) throw { code: 404, message: 'Category not found' }
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = err?.code ?? HttpStatusCode.InternalServerError
      return res.status(code).json(api(null, code, { err }))
    }
  }

  /**
   * DELETE /api/v1/categories/:id
   */
  static async remove(req, res) {
    try {
      const deleted = await query.softDelete(req.params.id)
      if (!deleted) throw { code: 404, message: 'Category not found' }
      return res.status(HttpStatusCode.Ok).json(api(null, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = err?.code ?? HttpStatusCode.InternalServerError
      return res.status(code).json(api(null, code, { err }))
    }
  }
}

module.exports = CategoryController

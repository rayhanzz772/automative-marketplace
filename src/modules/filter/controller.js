'use strict'

const { HttpStatusCode } = require('axios')
const { api } = require('../../utils/api')
const query = require('./query')

class FilterController {
  /**
   * GET /api/v1/filters/category/:categoryId
   * Return all filters for a category (including inherited from parent/ancestor categories)
   */
  static async getCategoryFilters(req, res) {
    try {
      const data = await query.getCategoryFilters(req.params.categoryId)
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = err?.code ?? HttpStatusCode.InternalServerError
      return res.status(code).json(api(null, code, { err }))
    }
  }

  /**
   * GET /api/v1/filters/facets
   * Return facet counts (makes, fuel types, transmissions, price range, dynamic attr stats)
   * Query params: category_id (optional)
   */
  static async getFacets(req, res) {
    try {
      const { category_id } = req.query
      const data = await query.getFacetCounts(category_id)
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = err?.code ?? HttpStatusCode.InternalServerError
      return res.status(code).json(api(null, code, { err }))
    }
  }

  /**
   * POST /api/v1/filters/attributes
   * Define a new filter attribute for a category
   */
  static async createAttribute(req, res) {
    try {
      const {
        category_id,
        key,
        label,
        attr_type,
        unit,
        min_value,
        max_value,
        is_required,
        is_searchable,
        sort_order,
        options
      } = req.body

      if (!category_id || !key || !label || !attr_type) {
        throw { code: 400, message: 'category_id, key, label, and attr_type are required' }
      }

      const data = await query.createAttribute({
        categoryId: category_id,
        key,
        label,
        attrType: attr_type,
        unit,
        minValue: min_value,
        maxValue: max_value,
        isRequired: is_required,
        isSearchable: is_searchable,
        sortOrder: sort_order,
        options
      })

      return res.status(HttpStatusCode.Created).json(api(data, HttpStatusCode.Created, { req }))
    } catch (err) {
      const code = err?.code ?? HttpStatusCode.InternalServerError
      return res.status(code).json(api(null, code, { err }))
    }
  }

  /**
   * DELETE /api/v1/filters/attributes/:id
   */
  static async deleteAttribute(req, res) {
    try {
      const deleted = await query.softDeleteAttribute(req.params.id)
      if (!deleted) throw { code: 404, message: 'Filter attribute not found' }
      return res.status(HttpStatusCode.Ok).json(api(null, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = err?.code ?? HttpStatusCode.InternalServerError
      return res.status(code).json(api(null, code, { err }))
    }
  }
}

module.exports = FilterController

'use strict'

const { HttpStatusCode } = require('axios')
const { api } = require('../../utils/api')
const query = require('./query')

class SearchController {
  /**
   * GET /api/v1/search
   * Full-text search with faceted / multi-filter combinations
   */
  static async search(req, res) {
    try {
      const {
        q,
        category_id,
        make,
        model,
        condition,
        transmission,
        fuel_type,
        city,
        province,
        year_min,
        year_max,
        price_min,
        price_max,
        mileage_min,
        mileage_max,
        status,
        sort_by,
        sort_order,
        page,
        per_page,
        ...rest
      } = req.query

      // Dynamic attribute filters (e.g. attr_*)
      const attributes = {}
      for (const [key, val] of Object.entries(rest)) {
        if (key.startsWith('attr_')) {
          const attrId = key.replace('attr_', '')
          attributes[attrId] = val
        }
      }

      const data = await query.searchListings({
        q,
        categoryId: category_id,
        make,
        model,
        condition,
        transmission,
        fuelType: fuel_type,
        city,
        province,
        yearMin: year_min,
        yearMax: year_max,
        priceMin: price_min,
        priceMax: price_max,
        mileageMin: mileage_min,
        mileageMax: mileage_max,
        status: status || 'available',
        sortBy: sort_by || (q ? 'relevance' : 'created_at'),
        sortOrder: sort_order || 'DESC',
        page: parseInt(page) || 1,
        perPage: parseInt(per_page) || 10,
        attributes
      })

      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = err?.code ?? HttpStatusCode.InternalServerError
      return res.status(code).json(api(null, code, { err }))
    }
  }

  /**
   * GET /api/v1/search/suggestions
   */
  static async suggestions(req, res) {
    try {
      const { q } = req.query
      const data = await query.getSuggestions(q)
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = err?.code ?? HttpStatusCode.InternalServerError
      return res.status(code).json(api(null, code, { err }))
    }
  }
}

module.exports = SearchController

'use strict'

const { HttpStatusCode } = require('axios')
const { api } = require('../../utils/api')
const { buildCacheKey, withCache } = require('../../utils/redis')
const query = require('./query')

class FilterController {

  static async getCategoryFilters(req, res) {
    try {
      const data = await withCache(
        await buildCacheKey('filters:category', { categoryId: req.params.categoryId }, ['categories', 'filters']),
        300,
        () => query.getCategoryFilters(req.params.categoryId)
      )
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

  static async getFacets(req, res) {
    try {
      const { category_id } = req.query
      const data = await withCache(
        await buildCacheKey('filters:facets', { categoryId: category_id }, ['categories', 'listings']),
        120,
        () => query.getFacetCounts(category_id)
      )
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

}

module.exports = FilterController

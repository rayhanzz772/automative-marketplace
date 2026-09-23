'use strict'

const { HttpStatusCode } = require('axios')
const { api } = require('../../utils/api')
const query = require('./query')

class FilterController {

  static async getCategoryFilters(req, res) {
    try {
      const data = await query.getCategoryFilters(req.params.categoryId)
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

  static async getFacets(req, res) {
    try {
      const { category_id } = req.query
      const data = await query.getFacetCounts(category_id)
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

}

module.exports = FilterController

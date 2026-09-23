'use strict'

const { HttpStatusCode } = require('axios')
const cuid = require('cuid')
const { api } = require('../../utils/api')
const query = require('./query')
const listingQuery = require('../listing/query')

class CategoryController {
  static async getTree(req, res) {
    try {
      const data = await query.getTree()
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

  static async getById(req, res) {
    try {
      const data = await query.getById(req.params.id)
      if (!data) throw { code: 404, message: 'Category not found' }
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

  static async getListings(req, res) {
    try {
      const {
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
        cursor,
        page,
        per_page,
        ...rest
      } = req.query

      const attributes = {}
      for (const [key, val] of Object.entries(rest)) {
        if (key.startsWith('attr_')) {
          const attrId = key.replace('attr_', '')
          attributes[attrId] = val
        }
      }

      const data = await listingQuery.getAll({
        categoryId: req.params.id,
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
        sortBy: sort_by || 'created_at',
        sortOrder: sort_order || 'DESC',
        cursor,
        page: parseInt(page) || 1,
        perPage: parseInt(per_page) || 10,
        attributes
      })

      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

  static async getChildren(req, res) {
    try {
      const data = await query.getChildren(req.params.id)
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

  static async getFilters(req, res) {
    try {
      const data = await query.getFiltersForCategory(req.params.id)
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

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
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

  static async update(req, res) {
    try {
      const data = await query.update(req.params.id, req.body)
      if (!data) throw { code: 404, message: 'Category not found' }
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

}

module.exports = CategoryController

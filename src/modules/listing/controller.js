'use strict'

const { HttpStatusCode } = require('axios')
const { api } = require('../../utils/api')
const query = require('./query')
const { createListingSchema, updateListingSchema } = require('./schema')

class ListingController {
  /**
   * GET /listings
   * Browse listings with filters, sorting + cursor / offset pagination
   */
  static async getAll(req, res) {
    try {
      const {
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
        cursor,
        limit,
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

      const data = await query.getAll({
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
        sortBy: sort_by || 'created_at',
        sortOrder: sort_order || 'DESC',
        cursor,
        limit: limit ? parseInt(limit) : undefined,
        page: parseInt(page) || 1,
        perPage: parseInt(per_page) || 10,
        attributes
      })

      const response = api(data, HttpStatusCode.Ok, { req })
      if (data.next_cursor !== undefined) {
        response.metadata.next_cursor = data.next_cursor
        response.metadata.has_more = data.has_more
      }

      return res.status(HttpStatusCode.Ok).json(response)
    } catch (err) {
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

  /**
   * GET /listings/:id
   */
  static async getById(req, res) {
    try {
      const data = await query.getById(req.params.id)
      if (!data) throw { code: 404, message: 'Listing not found' }
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

  /**
   * POST /listings
   */
  static async create(req, res) {
    try {
      const validated = createListingSchema.parse(req.body)
      const data = await query.create(validated)
      return res.status(HttpStatusCode.Created).json(api(data, HttpStatusCode.Created, { req }))
    } catch (err) {
      if (err.name === 'ZodError') {
        return res.status(HttpStatusCode.BadRequest).json(api(null, HttpStatusCode.BadRequest, { err }))
      }
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

  /**
   * PATCH /listings/:id
   */
  static async update(req, res) {
    try {
      const validated = updateListingSchema.parse(req.body)
      const data = await query.update(req.params.id, validated)
      if (!data) throw { code: 404, message: 'Listing not found' }
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      if (err.name === 'ZodError') {
        return res.status(HttpStatusCode.BadRequest).json(api(null, HttpStatusCode.BadRequest, { err }))
      }
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

  /**
   * DELETE /listings/:id
   */
  static async remove(req, res) {
    try {
      const deleted = await query.softDelete(req.params.id)
      if (!deleted) throw { code: 404, message: 'Listing not found' }
      return res.status(HttpStatusCode.Ok).json(api(null, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }
}

module.exports = ListingController

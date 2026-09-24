'use strict'

const { HttpStatusCode } = require('axios')
const cuid = require('cuid')
const { api } = require('../../utils/api')
const { buildCacheKey, withCache } = require('../../utils/redis')
const query = require('./query')
const listingQuery = require('../listing/query')
const { createCategorySchema, updateCategorySchema } = require('./schema')

class CategoryController {

  /**
   * GET /categories/tree
   */
  static async getTree(req, res) {
    try {
      const data = await withCache(
        await buildCacheKey('categories:tree', {}, ['categories']),
        300,
        () => query.getTree()
      )
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

  /**
   * GET /categories/:id
   */
  static async getById(req, res) {
    try {
      const data = await withCache(
        await buildCacheKey('categories:detail', { id: req.params.id }, ['categories']),
        300,
        () => query.getById(req.params.id)
      )
      if (!data) throw { code: 404, message: 'Category not found' }
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

  /**
   * GET /categories/:id/listings
   */
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

      const params = {
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
      }

      const data = await withCache(
        await buildCacheKey('categories:listings', params, ['categories', 'listings']),
        60,
        () => listingQuery.getAll(params)
      )

      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

  /**
   * POST /categories
   */
  static async create(req, res) {
    try {
      const validatedData = createCategorySchema.parse(req.body)

      const data = await query.create({
        id: cuid(),
        parentId: validatedData.parent_id || null,
        name: validatedData.name,
        slug: validatedData.slug,
        iconUrl: validatedData.icon_url || null,
        sortOrder: validatedData.sort_order
      })

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
   * PATCH /categories/:id
   */
  static async update(req, res) {
    try {
      const validatedData = updateCategorySchema.parse(req.body)
      const data = await query.update(req.params.id, validatedData)
      if (!data) throw { code: 404, message: 'Category not found' }
      return res.status(HttpStatusCode.Ok).json(api(data, HttpStatusCode.Ok, { req }))
    } catch (err) {
      if (err.name === 'ZodError') {
        return res.status(HttpStatusCode.BadRequest).json(api(null, HttpStatusCode.BadRequest, { err }))
      }
      const code = typeof err?.code === 'number' ? err.code : (err?.status || HttpStatusCode.InternalServerError)
      return res.status(code).json(api(null, code, { err }))
    }
  }

}

module.exports = CategoryController

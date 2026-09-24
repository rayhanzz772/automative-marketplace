'use strict'

const { z } = require('zod')

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Category slug is required'),
  parent_id: z.string().optional().nullable(),
  icon_url: z.string().url('Icon URL must be valid').optional().nullable(),
  sort_order: z.number().int().min(0, 'Sort order cannot be negative').optional().default(0)
})

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').optional(),
  slug: z.string().min(1, 'Category slug is required').optional(),
  icon_url: z.string().url('Icon URL must be valid').optional().nullable(),
  sort_order: z.number().int().min(0, 'Sort order cannot be negative').optional(),
  is_active: z.boolean().optional()
})

module.exports = {
  createCategorySchema,
  updateCategorySchema
}
'use strict'

const { z } = require('zod')

const createListingSchema = z.object({
  seller_id: z.string().min(1, 'Seller ID is required'),
  category_id: z.string().min(1, 'Category ID is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  variant: z.string().optional().nullable(),
  year: z.number().int().min(1900).max(2100),
  mileage: z.number().int().min(0).default(0),
  condition: z.enum(['new', 'used']),
  transmission: z.enum(['manual', 'automatic', 'cvt', 'amt', 'dct']),
  fuel_type: z.enum(['petrol', 'diesel', 'electric', 'hybrid', 'lpg']),
  color: z.string().min(1, 'Color is required'),
  engine_cc: z.number().int().positive().optional().nullable(),
  seat_count: z.number().int().positive().optional().nullable(),
  price: z.number().positive('Price must be greater than 0'),
  is_negotiable: z.boolean().default(false),
  province: z.string().min(1, 'Province is required'),
  city: z.string().min(1, 'City is required'),
  district: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  images: z
    .array(
      z.object({
        url: z.string().url('Image URL must be valid'),
        sort_order: z.number().int().default(0),
        alt_text: z.string().optional().nullable()
      })
    )
    .optional()
    .default([]),
  attributes: z
    .array(
      z.object({
        attribute_id: z.string().min(1),
        value_enum: z.string().optional().nullable(),
        value_min: z.number().optional().nullable(),
        value_max: z.number().optional().nullable(),
        value_boolean: z.boolean().optional().nullable()
      })
    )
    .optional()
    .default([])
})

const updateListingSchema = createListingSchema.partial().omit({ seller_id: true })

module.exports = {
  createListingSchema,
  updateListingSchema
}

'use strict'

const db = require('../../utils/db')
const cuid = require('cuid')
const { invalidate } = require('../../utils/redis')

async function getCategoryFilters(categoryId) {
  const query = `
    SELECT 
      fa.id,
      fa.category_id,
      c.name AS defined_in_category,
      cc.depth AS inheritance_depth,
      fa.key,
      fa.label,
      fa.attr_type,
      fa.unit,
      fa.min_value,
      fa.max_value,
      fa.is_required,
      fa.is_searchable,
      fa.sort_order,
      COALESCE(
        json_agg(
          json_build_object(
            'id', ao.id,
            'label', ao.label,
            'value', ao.value,
            'sort_order', ao.sort_order
          ) ORDER BY ao.sort_order ASC
        ) FILTER (WHERE ao.id IS NOT NULL),
        '[]'
      ) AS options
    FROM category_closures cc
    JOIN filter_attributes fa ON fa.category_id = cc.ancestor_id AND fa.deleted_at IS NULL
    JOIN categories c ON c.id = fa.category_id
    LEFT JOIN attribute_options ao ON ao.attribute_id = fa.id
    WHERE cc.descendant_id = $1 AND fa.is_searchable = TRUE
    GROUP BY fa.id, fa.category_id, c.name, cc.depth, fa.key, fa.label, fa.attr_type, fa.unit, fa.min_value, fa.max_value, fa.is_required, fa.is_searchable, fa.sort_order
    ORDER BY cc.depth DESC, fa.sort_order ASC
  `
  const { rows } = await db.query(query, [categoryId])
  return rows
}

async function getFacetCounts(categoryId) {
  const categoryCondition = categoryId
    ? `AND l.category_id IN (SELECT descendant_id FROM category_closures WHERE ancestor_id = $1)`
    : ''
  const params = categoryId ? [categoryId] : []

  const makesSql = `
    SELECT l.make AS value, COUNT(*)::INT AS count
    FROM listings l
    WHERE l.status = 'available' AND l.deleted_at IS NULL ${categoryCondition}
    GROUP BY l.make
    ORDER BY count DESC, l.make ASC
  `

  const fuelTypesSql = `
    SELECT l.fuel_type AS value, COUNT(*)::INT AS count
    FROM listings l
    WHERE l.status = 'available' AND l.deleted_at IS NULL ${categoryCondition}
    GROUP BY l.fuel_type
    ORDER BY count DESC
  `

  const transmissionsSql = `
    SELECT l.transmission AS value, COUNT(*)::INT AS count
    FROM listings l
    WHERE l.status = 'available' AND l.deleted_at IS NULL ${categoryCondition}
    GROUP BY l.transmission
    ORDER BY count DESC
  `

  const conditionsSql = `
    SELECT l.condition AS value, COUNT(*)::INT AS count
    FROM listings l
    WHERE l.status = 'available' AND l.deleted_at IS NULL ${categoryCondition}
    GROUP BY l.condition
    ORDER BY count DESC
  `

  const priceStatsSql = `
    SELECT 
      MIN(l.price)::NUMERIC AS min_price,
      MAX(l.price)::NUMERIC AS max_price,
      MIN(l.year)::INT AS min_year,
      MAX(l.year)::INT AS max_year,
      MIN(l.mileage)::INT AS min_mileage,
      MAX(l.mileage)::INT AS max_mileage
    FROM listings l
    WHERE l.status = 'available' AND l.deleted_at IS NULL ${categoryCondition}
  `

  const dynamicFacetsSql = `
    SELECT 
      fa.id AS attribute_id,
      fa.key AS attribute_key,
      fa.label AS attribute_label,
      lav.value_enum AS value,
      COUNT(*)::INT AS count
    FROM listing_attribute_values lav
    JOIN listings l ON l.id = lav.listing_id AND l.status = 'available' AND l.deleted_at IS NULL ${categoryCondition}
    JOIN filter_attributes fa ON fa.id = lav.attribute_id AND fa.attr_type = 'enum' AND fa.deleted_at IS NULL
    WHERE lav.value_enum IS NOT NULL
    GROUP BY fa.id, fa.key, fa.label, lav.value_enum
    ORDER BY fa.sort_order ASC, count DESC
  `

  const [makesRes, fuelsRes, transRes, condsRes, statsRes, dynRes] = await Promise.all([
    db.query(makesSql, params),
    db.query(fuelTypesSql, params),
    db.query(transmissionsSql, params),
    db.query(conditionsSql, params),
    db.query(priceStatsSql, params),
    db.query(dynamicFacetsSql, params)
  ])

  const dynamicFacets = {}
  for (const row of dynRes.rows) {
    if (!dynamicFacets[row.attribute_key]) {
      dynamicFacets[row.attribute_key] = {
        attribute_id: row.attribute_id,
        label: row.attribute_label,
        options: []
      }
    }
    dynamicFacets[row.attribute_key].options.push({
      value: row.value,
      count: row.count
    })
  }

  return {
    makes: makesRes.rows,
    fuel_types: fuelsRes.rows,
    transmissions: transRes.rows,
    conditions: condsRes.rows,
    stats: statsRes.rows[0] || {
      min_price: 0,
      max_price: 0,
      min_year: 0,
      max_year: 0,
      min_mileage: 0,
      max_mileage: 0
    },
    dynamic_attributes: dynamicFacets
  }
}


module.exports = {
  getCategoryFilters,
  getFacetCounts
}

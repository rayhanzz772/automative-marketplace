'use strict'

const db = require('../../utils/db')

/**
 * Execute full-text search combined with multi-filter combinations and category tree traversal.
 */
async function searchListings({
  q,
  categoryId,
  make,
  model,
  condition,
  transmission,
  fuelType,
  city,
  province,
  yearMin,
  yearMax,
  priceMin,
  priceMax,
  mileageMin,
  mileageMax,
  status = 'available',
  sortBy = 'relevance',
  sortOrder = 'DESC',
  page = 1,
  perPage = 10,
  attributes = {}
} = {}) {
  const conditions = ['l.deleted_at IS NULL']
  const params = []
  let paramIdx = 1

  let tsQueryParamIndex = null
  if (q && q.trim()) {
    tsQueryParamIndex = paramIdx++
    // Use plainto_tsquery with 'simple' configuration matching our trigger
    conditions.push(`l.search_vector @@ plainto_tsquery('simple', $${tsQueryParamIndex})`)
    params.push(q.trim())
  }

  if (status) {
    conditions.push(`l.status = $${paramIdx++}`)
    params.push(status)
  }

  // Hierarchical category filtering via closure table
  if (categoryId) {
    conditions.push(`l.category_id IN (
      SELECT descendant_id FROM category_closures WHERE ancestor_id = $${paramIdx++}
    )`)
    params.push(categoryId)
  }

  if (make) {
    conditions.push(`LOWER(l.make) = LOWER($${paramIdx++})`)
    params.push(make)
  }

  if (model) {
    conditions.push(`LOWER(l.model) LIKE LOWER($${paramIdx++})`)
    params.push(`%${model}%`)
  }

  if (condition) {
    conditions.push(`l.condition = $${paramIdx++}`)
    params.push(condition)
  }

  if (transmission) {
    conditions.push(`l.transmission = $${paramIdx++}`)
    params.push(transmission)
  }

  if (fuelType) {
    conditions.push(`l.fuel_type = $${paramIdx++}`)
    params.push(fuelType)
  }

  if (city) {
    conditions.push(`LOWER(l.city) = LOWER($${paramIdx++})`)
    params.push(city)
  }

  if (province) {
    conditions.push(`LOWER(l.province) = LOWER($${paramIdx++})`)
    params.push(province)
  }

  if (yearMin) {
    conditions.push(`l.year >= $${paramIdx++}`)
    params.push(Number(yearMin))
  }

  if (yearMax) {
    conditions.push(`l.year <= $${paramIdx++}`)
    params.push(Number(yearMax))
  }

  if (priceMin) {
    conditions.push(`l.price >= $${paramIdx++}`)
    params.push(Number(priceMin))
  }

  if (priceMax) {
    conditions.push(`l.price <= $${paramIdx++}`)
    params.push(Number(priceMax))
  }

  if (mileageMin) {
    conditions.push(`l.mileage >= $${paramIdx++}`)
    params.push(Number(mileageMin))
  }

  if (mileageMax) {
    conditions.push(`l.mileage <= $${paramIdx++}`)
    params.push(Number(mileageMax))
  }

  // Dynamic filter attributes: check listing_attribute_values
  if (attributes && typeof attributes === 'object' && Object.keys(attributes).length > 0) {
    for (const [attrId, val] of Object.entries(attributes)) {
      if (val === undefined || val === null || val === '') continue
      if (typeof val === 'boolean' || val === 'true' || val === 'false') {
        const boolVal = val === true || val === 'true'
        conditions.push(`EXISTS (
          SELECT 1 FROM listing_attribute_values lav 
          WHERE lav.listing_id = l.id AND lav.attribute_id = $${paramIdx++} AND lav.value_boolean = $${paramIdx++}
        )`)
        params.push(attrId, boolVal)
      } else if (typeof val === 'number') {
        conditions.push(`EXISTS (
          SELECT 1 FROM listing_attribute_values lav 
          WHERE lav.listing_id = l.id AND lav.attribute_id = $${paramIdx++} 
            AND (lav.value_min <= $${paramIdx} AND (lav.value_max IS NULL OR lav.value_max >= $${paramIdx}))
        )`)
        params.push(attrId, val)
        paramIdx++
      } else {
        conditions.push(`EXISTS (
          SELECT 1 FROM listing_attribute_values lav 
          WHERE lav.listing_id = l.id AND lav.attribute_id = $${paramIdx++} AND lav.value_enum = $${paramIdx++}
        )`)
        params.push(attrId, val)
      }
    }
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`

  // Sorting
  let orderByClause = 'l.created_at DESC'
  const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

  if (sortBy === 'relevance' && tsQueryParamIndex !== null) {
    orderByClause = `ts_rank_cd(l.search_vector, plainto_tsquery('simple', $${tsQueryParamIndex})) DESC, l.created_at DESC`
  } else if (sortBy === 'price') {
    orderByClause = `l.price ${sortDirection}`
  } else if (sortBy === 'year') {
    orderByClause = `l.year ${sortDirection}`
  } else if (sortBy === 'mileage') {
    orderByClause = `l.mileage ${sortDirection}`
  } else if (sortBy === 'views') {
    orderByClause = `l.views_count ${sortDirection}`
  }

  const countQuery = `
    SELECT COUNT(*)::INT AS total
    FROM listings l
    ${whereClause}
  `
  const { rows: countRows } = await db.query(countQuery, params)
  const total = countRows[0]?.total || 0

  const offset = (page - 1) * perPage
  const dataParams = [...params, perPage, offset]

  const rankSelect = tsQueryParamIndex !== null
    ? `, ts_rank_cd(l.search_vector, plainto_tsquery('simple', $${tsQueryParamIndex})) AS relevance_score`
    : ''

  const dataQuery = `
    SELECT 
      l.id,
      l.category_id,
      c.name AS category_name,
      c.slug AS category_slug,
      l.make,
      l.model,
      l.variant,
      l.year,
      l.mileage,
      l.condition,
      l.transmission,
      l.fuel_type,
      l.color,
      l.engine_cc,
      l.seat_count,
      l.price,
      l.is_negotiable,
      l.province,
      l.city,
      l.district,
      l.title,
      l.status,
      l.views_count,
      l.created_at
      ${rankSelect},
      (
        SELECT li.url 
        FROM listing_images li 
        WHERE li.listing_id = l.id 
        ORDER BY li.sort_order ASC, li.created_at ASC 
        LIMIT 1
      ) AS primary_image_url
    FROM listings l
    LEFT JOIN categories c ON c.id = l.category_id
    ${whereClause}
    ORDER BY ${orderByClause}
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `

  const { rows } = await db.query(dataQuery, dataParams)

  return {
    rows,
    count: total,
    page: Number(page),
    per_page: Number(perPage),
    query: q || null
  }
}

/**
 * Autocomplete suggestions for search input.
 */
async function getSuggestions(q) {
  if (!q || !q.trim()) return []
  const searchTerm = `${q.trim()}%`

  const query = `
    SELECT DISTINCT make AS text, 'make' AS type
    FROM listings
    WHERE make ILIKE $1 AND deleted_at IS NULL
    UNION
    SELECT DISTINCT model AS text, 'model' AS type
    FROM listings
    WHERE model ILIKE $1 AND deleted_at IS NULL
    UNION
    SELECT DISTINCT city AS text, 'city' AS type
    FROM listings
    WHERE city ILIKE $1 AND deleted_at IS NULL
    LIMIT 10
  `
  const { rows } = await db.query(query, [searchTerm])
  return rows
}

module.exports = {
  searchListings,
  getSuggestions
}

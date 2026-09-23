'use strict'

const db = require('../../utils/db')
const cuid = require('cuid')

/**
 * Encode cursor object to base64
 */
function encodeCursor(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64')
}

/**
 * Decode base64 cursor string
 */
function decodeCursor(str) {
  try {
    return JSON.parse(Buffer.from(str, 'base64').toString('utf8'))
  } catch {
    return null
  }
}

/**
 * Browse listings with multi-filters, sorting, and cursor-based / offset pagination.
 */
async function getAll({
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
  sortBy = 'created_at',
  sortOrder = 'DESC',
  cursor = null,
  limit = 10,
  page = 1,
  perPage = 10,
  attributes = {}
} = {}) {
  const pageSize = Number(limit || perPage || 10)
  const conditions = ['l.deleted_at IS NULL']
  const params = []
  let paramIdx = 1

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

  // Dynamic filter attributes (listing_attribute_values)
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

  // Sorting
  const allowedSortColumns = {
    created_at: 'l.created_at',
    price: 'l.price',
    year: 'l.year',
    mileage: 'l.mileage',
    views_count: 'l.views_count'
  }
  const sortCol = allowedSortColumns[sortBy] || 'l.created_at'
  const isAsc = sortOrder.toUpperCase() === 'ASC'
  const sortDir = isAsc ? 'ASC' : 'DESC'

  // Cursor Pagination handling
  const parsedCursor = cursor ? decodeCursor(cursor) : null
  if (parsedCursor && parsedCursor.id && parsedCursor.sortValue !== undefined) {
    const operator = isAsc ? '>' : '<'
    conditions.push(`(${sortCol}, l.id) ${operator} ($${paramIdx++}, $${paramIdx++})`)
    params.push(parsedCursor.sortValue, parsedCursor.id)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Total count for metadata
  const countQuery = `
    SELECT COUNT(*)::INT AS total
    FROM listings l
    ${whereClause}
  `
  const countResult = await db.query(countQuery, params)
  const total = countResult.rows[0]?.total || 0

  // Fetch limit + 1 to check for has_more in cursor pagination
  const fetchLimit = pageSize + 1
  const offset = cursor ? 0 : (page - 1) * pageSize
  const dataParams = [...params, fetchLimit]

  let paginationClause = `LIMIT $${paramIdx++}`
  if (!cursor) {
    paginationClause += ` OFFSET $${paramIdx++}`
    dataParams.push(offset)
  }

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
      l.created_at,
      l.updated_at,
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
    ORDER BY ${sortCol} ${sortDir}, l.id ${sortDir}
    ${paginationClause}
  `

  const { rows } = await db.query(dataQuery, dataParams)

  const hasMore = rows.length > pageSize
  const items = hasMore ? rows.slice(0, pageSize) : rows

  let nextCursor = null
  if (items.length > 0 && hasMore) {
    const lastItem = items[items.length - 1]
    const sortValue = sortBy === 'price' ? lastItem.price
      : sortBy === 'year' ? lastItem.year
      : sortBy === 'mileage' ? lastItem.mileage
      : sortBy === 'views_count' ? lastItem.views_count
      : lastItem.created_at
    nextCursor = encodeCursor({ id: lastItem.id, sortValue })
  }

  return {
    rows: items,
    count: total,
    page: Number(page),
    per_page: pageSize,
    next_cursor: nextCursor,
    has_more: hasMore
  }
}

/**
 * Fetch a single listing by ID with full details, images, dynamic attributes, and category breadcrumb.
 */
async function getById(id) {
  const listingQuery = `
    SELECT 
      l.*,
      c.name AS category_name,
      c.slug AS category_slug
    FROM listings l
    LEFT JOIN categories c ON c.id = l.category_id
    WHERE l.id = $1 AND l.deleted_at IS NULL
  `
  const { rows: listingRows } = await db.query(listingQuery, [id])
  if (listingRows.length === 0) return null

  const listing = listingRows[0]

  // Increment views count asynchronously
  db.query(`UPDATE listings SET views_count = views_count + 1 WHERE id = $1`, [id]).catch(() => {})

  // Fetch images
  const imagesQuery = `
    SELECT id, url, sort_order, alt_text
    FROM listing_images
    WHERE listing_id = $1
    ORDER BY sort_order ASC, created_at ASC
  `
  const { rows: images } = await db.query(imagesQuery, [id])
  listing.images = images

  // Fetch dynamic attribute values with attribute definitions
  const attrsQuery = `
    SELECT 
      lav.id,
      lav.attribute_id,
      fa.key,
      fa.label,
      fa.attr_type,
      fa.unit,
      lav.value_enum,
      lav.value_min,
      lav.value_max,
      lav.value_boolean
    FROM listing_attribute_values lav
    JOIN filter_attributes fa ON fa.id = lav.attribute_id
    WHERE lav.listing_id = $1 AND fa.deleted_at IS NULL
    ORDER BY fa.sort_order ASC
  `
  const { rows: attributes } = await db.query(attrsQuery, [id])
  listing.attributes = attributes

  // Category breadcrumb
  const breadcrumbQuery = `
    SELECT c.id, c.name, c.slug, cc.depth
    FROM category_closures cc
    JOIN categories c ON c.id = cc.ancestor_id
    WHERE cc.descendant_id = $1 AND c.deleted_at IS NULL
    ORDER BY cc.depth DESC
  `
  const { rows: breadcrumbs } = await db.query(breadcrumbQuery, [listing.category_id])
  listing.breadcrumbs = breadcrumbs

  return listing
}

/**
 * Create listing with images and dynamic attributes inside a PostgreSQL transaction.
 */
async function create(data) {
  const client = await db.getClient()
  try {
    await client.query('BEGIN')

    const listingId = data.id || cuid()

    const insertListingSql = `
      INSERT INTO listings (
        id, category_id, make, model, variant, year,
        mileage, condition, transmission, fuel_type, color, engine_cc,
        seat_count, price, is_negotiable, province, city, district,
        latitude, longitude, title, description, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, 'available', NOW(), NOW()
      )
      RETURNING *
    `
    const listingValues = [
      listingId,
      data.category_id,
      data.make,
      data.model,
      data.variant || null,
      data.year,
      data.mileage || 0,
      data.condition,
      data.transmission,
      data.fuel_type,
      data.color,
      data.engine_cc || null,
      data.seat_count || null,
      data.price,
      data.is_negotiable ?? false,
      data.province,
      data.city,
      data.district || null,
      data.latitude || null,
      data.longitude || null,
      data.title,
      data.description || null
    ]

    await client.query(insertListingSql, listingValues)

    // Insert Images
    if (Array.isArray(data.images) && data.images.length > 0) {
      for (let i = 0; i < data.images.length; i++) {
        const img = data.images[i]
        await client.query(
          `INSERT INTO listing_images (id, listing_id, url, sort_order, alt_text, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [cuid(), listingId, img.url, img.sort_order ?? i, img.alt_text || null]
        )
      }
    }

    // Insert Dynamic Attributes
    if (Array.isArray(data.attributes) && data.attributes.length > 0) {
      for (const attr of data.attributes) {
        await client.query(
          `INSERT INTO listing_attribute_values (
             id, listing_id, attribute_id, value_enum, value_min, value_max, value_boolean, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT (listing_id, attribute_id) DO UPDATE
           SET value_enum = EXCLUDED.value_enum,
               value_min = EXCLUDED.value_min,
               value_max = EXCLUDED.value_max,
               value_boolean = EXCLUDED.value_boolean,
               updated_at = NOW()`,
          [
            cuid(),
            listingId,
            attr.attribute_id,
            attr.value_enum || null,
            attr.value_min ?? null,
            attr.value_max ?? null,
            attr.value_boolean ?? null
          ]
        )
      }
    }

    await client.query('COMMIT')
    return getById(listingId)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/**
 * Update an existing listing.
 */
async function update(id, data) {
  const client = await db.getClient()
  try {
    await client.query('BEGIN')

    const allowedFields = [
      'category_id', 'make', 'model', 'variant', 'year', 'mileage',
      'condition', 'transmission', 'fuel_type', 'color', 'engine_cc',
      'seat_count', 'price', 'is_negotiable', 'province', 'city',
      'district', 'latitude', 'longitude', 'title', 'description', 'status'
    ]

    const setClauses = []
    const values = []
    let idx = 1

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = $${idx++}`)
        values.push(data[field])
      }
    }

    if (setClauses.length > 0) {
      setClauses.push(`updated_at = NOW()`)
      values.push(id)
      const updateSql = `
        UPDATE listings
        SET ${setClauses.join(', ')}
        WHERE id = $${idx} AND deleted_at IS NULL
        RETURNING id
      `
      const { rows } = await client.query(updateSql, values)
      if (rows.length === 0) {
        await client.query('ROLLBACK')
        return null
      }
    }

    if (Array.isArray(data.images)) {
      await client.query(`DELETE FROM listing_images WHERE listing_id = $1`, [id])
      for (let i = 0; i < data.images.length; i++) {
        const img = data.images[i]
        await client.query(
          `INSERT INTO listing_images (id, listing_id, url, sort_order, alt_text, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [cuid(), id, img.url, img.sort_order ?? i, img.alt_text || null]
        )
      }
    }

    if (Array.isArray(data.attributes)) {
      await client.query(`DELETE FROM listing_attribute_values WHERE listing_id = $1`, [id])
      for (const attr of data.attributes) {
        await client.query(
          `INSERT INTO listing_attribute_values (
             id, listing_id, attribute_id, value_enum, value_min, value_max, value_boolean, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [
            cuid(),
            id,
            attr.attribute_id,
            attr.value_enum || null,
            attr.value_min ?? null,
            attr.value_max ?? null,
            attr.value_boolean ?? null
          ]
        )
      }
    }

    await client.query('COMMIT')
    return getById(id)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/**
 * Soft delete a listing (sets status -> removed and deleted_at = NOW())
 */
async function softDelete(id) {
  const { rows } = await db.query(
    `UPDATE listings 
     SET status = 'sold', deleted_at = NOW(), updated_at = NOW() 
     WHERE id = $1 AND deleted_at IS NULL 
     RETURNING id`,
    [id]
  )
  return rows.length > 0
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  softDelete
}

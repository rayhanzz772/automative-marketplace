'use strict'

const db = require('../../../config/config')

/**
 * Insert closure rows when a new category is created.
 * For a new node with the given parentId, we copy all ancestor rows
 * of the parent and add one row for the self-reference.
 *
 * @param {object} client - pg PoolClient (inside a transaction)
 * @param {string} id     - new category id
 * @param {string|null} parentId
 */
async function insertClosureRows(client, id, parentId) {
  /* Self-reference (depth 0) */
  await client.query(
    `INSERT INTO category_closures(ancestor_id, descendant_id, depth)
     VALUES ($1, $1, 0)`,
    [id]
  )

  if (parentId) {
    /* Copy all ancestor rows of the parent, increase depth by 1 */
    await client.query(
      `INSERT INTO category_closures(ancestor_id, descendant_id, depth)
       SELECT ancestor_id, $1, depth + 1
       FROM   category_closures
       WHERE  descendant_id = $2`,
      [id, parentId]
    )
  }
}

/**
 * GET /categories — flat list ordered for tree rendering
 * Returns all active categories (client builds the tree from parent_id)
 */
async function getAll() {
  const { rows } = await db.query(`
    SELECT id, parent_id, name, slug, icon_url, is_active, sort_order
    FROM   categories
    WHERE  deleted_at IS NULL
    ORDER  BY sort_order ASC, name ASC
  `)
  return rows
}

/**
 * GET /categories/:id — single category with its breadcrumb path
 */
async function getById(id) {
  /* Breadcrumb: ancestors ordered root → current (depth DESC) */
  const { rows: breadcrumb } = await db.query(
    `SELECT c.id, c.name, c.slug, cc.depth
     FROM   category_closures cc
     JOIN   categories c ON c.id = cc.ancestor_id
     WHERE  cc.descendant_id = $1
       AND  c.deleted_at IS NULL
     ORDER  BY cc.depth DESC`,
    [id]
  )

  const { rows } = await db.query(
    `SELECT id, parent_id, name, slug, icon_url, is_active, sort_order
     FROM   categories
     WHERE  id = $1 AND deleted_at IS NULL`,
    [id]
  )

  if (!rows.length) return null
  return { ...rows[0], breadcrumb }
}

/**
 * GET /categories/:id/children — direct children only (depth = 1)
 */
async function getChildren(parentId) {
  const { rows } = await db.query(
    `SELECT c.id, c.parent_id, c.name, c.slug, c.icon_url, c.sort_order
     FROM   category_closures cc
     JOIN   categories c ON c.id = cc.descendant_id
     WHERE  cc.ancestor_id = $1
       AND  cc.depth = 1
       AND  c.deleted_at IS NULL
     ORDER  BY c.sort_order ASC, c.name ASC`,
    [parentId]
  )
  return rows
}

/**
 * GET /categories/:id/filters
 * Returns filter attributes applicable to the given category
 * INCLUDING inherited attributes from ancestor categories.
 * Each attribute includes its options (for enum type).
 */
async function getFiltersForCategory(categoryId) {
  /* Get all ancestor ids (including self) via closure table */
  const { rows: attrs } = await db.query(
    `SELECT DISTINCT ON (fa.key)
            fa.id, fa.category_id, fa.key, fa.label, fa.attr_type,
            fa.unit, fa.min_value, fa.max_value, fa.is_required,
            fa.is_searchable, fa.sort_order
     FROM   filter_attributes fa
     JOIN   category_closures cc ON cc.ancestor_id = fa.category_id
     WHERE  cc.descendant_id = $1
       AND  fa.deleted_at IS NULL
       AND  fa.is_searchable = TRUE
     ORDER  BY fa.key, cc.depth ASC`,
    [categoryId]
  )

  if (!attrs.length) return []

  /* Fetch options for enum-type attributes in one query */
  const enumAttrIds = attrs
    .filter((a) => a.attr_type === 'enum')
    .map((a) => a.id)

  let optionsMap = {}
  if (enumAttrIds.length > 0) {
    const placeholders = enumAttrIds.map((_, i) => `$${i + 1}`).join(', ')
    const { rows: options } = await db.query(
      `SELECT attribute_id, id, value, label, sort_order
       FROM   attribute_options
       WHERE  attribute_id IN (${placeholders})
       ORDER  BY sort_order ASC`,
      enumAttrIds
    )
    for (const opt of options) {
      if (!optionsMap[opt.attribute_id]) optionsMap[opt.attribute_id] = []
      optionsMap[opt.attribute_id].push(opt)
    }
  }

  return attrs.map((a) => ({
    ...a,
    options: a.attr_type === 'enum' ? (optionsMap[a.id] || []) : []
  }))
}

/**
 * POST /categories — create a category and insert closure rows
 */
async function create({ id, parentId, name, slug, iconUrl, sortOrder }) {
  const client = await db.getClient()
  try {
    await client.query('BEGIN')

    await client.query(
      `INSERT INTO categories(id, parent_id, name, slug, icon_url, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, parentId || null, name, slug, iconUrl || null, sortOrder || 0]
    )

    await insertClosureRows(client, id, parentId)

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
 * PATCH /categories/:id — update name / slug / icon / sort_order
 */
async function update(id, fields) {
  const allowed = ['name', 'slug', 'icon_url', 'sort_order', 'is_active']
  const setClauses = []
  const values = []

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      values.push(fields[key])
      setClauses.push(`${key} = $${values.length}`)
    }
  }

  if (!setClauses.length) return getById(id)

  values.push(id)
  const { rows } = await db.query(
    `UPDATE categories
     SET    ${setClauses.join(', ')}, updated_at = NOW()
     WHERE  id = $${values.length} AND deleted_at IS NULL
     RETURNING id`,
    values
  )

  return rows.length ? getById(id) : null
}

/**
 * DELETE /categories/:id — soft delete
 */
async function softDelete(id) {
  const { rows } = await db.query(
    `UPDATE categories
     SET    deleted_at = NOW(), updated_at = NOW()
     WHERE  id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [id]
  )
  return rows.length > 0
}

module.exports = {
  getAll,
  getById,
  getChildren,
  getFiltersForCategory,
  create,
  update,
  softDelete
}

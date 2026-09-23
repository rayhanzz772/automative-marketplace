'use strict'

const db = require('../../utils/db')
const { invalidate } = require('../../utils/redis')

async function insertClosureRows(client, id, parentId) {
  await client.query(
    `INSERT INTO category_closures(ancestor_id, descendant_id, depth)
     VALUES ($1, $1, 0)
     ON CONFLICT DO NOTHING`,
    [id]
  )

  if (parentId) {
    await client.query(
      `INSERT INTO category_closures(ancestor_id, descendant_id, depth)
       SELECT ancestor_id, $1, depth + 1
       FROM   category_closures
       WHERE  descendant_id = $2
       ON CONFLICT DO NOTHING`,
      [id, parentId]
    )
  }
}

function buildTree(categories, parentId = null) {
  return categories
    .filter((cat) => cat.parent_id === parentId)
    .map((cat) => ({
      ...cat,
      children: buildTree(categories, cat.id)
    }))
}

async function getTree() {
  const { rows } = await db.query(`
    SELECT id, parent_id, name, slug, icon_url, is_active, sort_order
    FROM   categories
    WHERE  deleted_at IS NULL
    ORDER  BY sort_order ASC, name ASC
  `)
  return buildTree(rows, null)
}

async function getAll() {
  const { rows } = await db.query(`
    SELECT id, parent_id, name, slug, icon_url, is_active, sort_order
    FROM   categories
    WHERE  deleted_at IS NULL
    ORDER  BY sort_order ASC, name ASC
  `)
  return rows
}

async function getById(id) {
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

  const { rows: children } = await db.query(
    `SELECT c.id, c.parent_id, c.name, c.slug, c.icon_url, c.sort_order
     FROM   category_closures cc
     JOIN   categories c ON c.id = cc.descendant_id
     WHERE  cc.ancestor_id = $1
       AND  cc.depth = 1
       AND  c.deleted_at IS NULL
     ORDER  BY c.sort_order ASC, c.name ASC`,
    [id]
  )

  return { ...rows[0], children, breadcrumb }
}

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

async function getFiltersForCategory(categoryId) {
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

    await invalidate('categories', 'filters')
    return getById(id)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

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

  if (rows.length) await invalidate('categories', 'filters')
  return rows.length ? getById(id) : null
}

async function softDelete(id) {
  const { rows } = await db.query(
    `UPDATE categories
     SET    deleted_at = NOW(), updated_at = NOW()
     WHERE  id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [id]
  )
  if (rows.length > 0) await invalidate('categories', 'filters')
  return rows.length > 0
}

module.exports = {
  getTree,
  getAll,
  getById,
  getChildren,
  getFiltersForCategory,
  create,
  update,
  softDelete
}

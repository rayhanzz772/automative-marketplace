'use strict'

require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
})

const tests = [
  {
    name: 'table_counts',
    sql: `
      SELECT
        (SELECT COUNT(*) FROM listings) AS listings,
        (SELECT COUNT(*) FROM listing_images) AS images,
        (SELECT COUNT(*) FROM listing_attribute_values) AS attributes
    `
  },
  {
    name: 'search_count',
    sql: `
      SELECT COUNT(*)
      FROM listings l
      WHERE l.deleted_at IS NULL
        AND l.status = 'available'
        AND l.search_vector @@ plainto_tsquery('simple', 'toyota')
    `
  },
  {
    name: 'search_data_with_rank_and_image',
    sql: `
      SELECT
        l.id,
        ts_rank_cd(l.search_vector, plainto_tsquery('simple', 'toyota')) AS relevance_score,
        (
          SELECT li.url
          FROM listing_images li
          WHERE li.listing_id = l.id
          ORDER BY li.sort_order ASC, li.created_at ASC
          LIMIT 1
        ) AS primary_image_url
      FROM listings l
      LEFT JOIN categories c ON c.id = l.category_id
      WHERE l.deleted_at IS NULL
        AND l.status = 'available'
        AND l.search_vector @@ plainto_tsquery('simple', 'toyota')
      ORDER BY relevance_score DESC, l.created_at DESC
      LIMIT 10 OFFSET 0
    `
  },
  {
    name: 'browse_data_with_image',
    sql: `
      SELECT
        l.id,
        l.created_at,
        (
          SELECT li.url
          FROM listing_images li
          WHERE li.listing_id = l.id
          ORDER BY li.sort_order ASC, li.created_at ASC
          LIMIT 1
        ) AS primary_image_url
      FROM listings l
      LEFT JOIN categories c ON c.id = l.category_id
      WHERE l.deleted_at IS NULL
        AND l.status = 'available'
      ORDER BY l.created_at DESC, l.id DESC
      LIMIT 10 OFFSET 0
    `
  },
  {
    name: 'dynamic_facets',
    sql: `
      SELECT
        fa.id AS attribute_id,
        fa.key,
        lav.value_enum AS value,
        COUNT(*)::INT AS count
      FROM listing_attribute_values lav
      JOIN listings l
        ON l.id = lav.listing_id
       AND l.status = 'available'
       AND l.deleted_at IS NULL
      JOIN filter_attributes fa
        ON fa.id = lav.attribute_id
       AND fa.attr_type = 'enum'
       AND fa.deleted_at IS NULL
      WHERE lav.value_enum IS NOT NULL
      GROUP BY fa.id, fa.key, lav.value_enum
      ORDER BY count DESC
    `
  }
]

function summarizePlan(plan) {
  const summary = {
    node: plan['Node Type'],
    actual_rows: plan['Actual Rows'],
    loops: plan['Actual Loops'],
    shared_read_blocks: plan['Shared Read Blocks'],
    shared_hit_blocks: plan['Shared Hit Blocks']
  }

  if (plan['Plans']) {
    summary.children = plan['Plans'].map(summarizePlan)
  }

  return summary
}

async function main() {
  for (const test of tests) {
    const result = await pool.query(
      `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${test.sql}`
    )
    const explain = result.rows[0]['QUERY PLAN'][0]

    console.log(JSON.stringify({
      name: test.name,
      planning_ms: explain['Planning Time'],
      execution_ms: explain['Execution Time'],
      plan: summarizePlan(explain.Plan)
    }, null, 2))
  }
}

main()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())

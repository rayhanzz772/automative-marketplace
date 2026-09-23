'use strict'

const { Pool } = require('pg')

/**
 * Shared PostgreSQL connection pool.
 * All modules import this instance — never create a new Pool per request.
 */
const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
})

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message)
})

/**
 * Execute a single parameterized query.
 * @param {string} text   - SQL string with $1, $2, … placeholders
 * @param {Array}  params - Positional parameter values
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params = []) {
  const start = Date.now()
  const result = await pool.query(text, params)
  const duration = Date.now() - start

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[db] ${duration}ms — ${text.slice(0, 80)}`)
  }

  return result
}

/**
 * Acquire a client from the pool for multi-statement transactions.
 * Remember to call client.release() when done.
 * @returns {Promise<import('pg').PoolClient>}
 *
 * @example
 * const client = await getClient()
 * try {
 *   await client.query('BEGIN')
 *   await client.query('INSERT ...')
 *   await client.query('COMMIT')
 * } catch (e) {
 *   await client.query('ROLLBACK')
 *   throw e
 * } finally {
 *   client.release()
 * }
 */
async function getClient() {
  return pool.connect()
}

module.exports = { query, getClient, pool }

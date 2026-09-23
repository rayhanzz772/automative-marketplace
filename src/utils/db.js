'use strict'

const { Pool } = require('pg')

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

async function query(text, params = []) {
  const start = Date.now()
  const result = await pool.query(text, params)
  const duration = Date.now() - start

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[db] ${duration}ms — ${text.slice(0, 80)}`)
  }

  return result
}

async function getClient() {
  return pool.connect()
}

module.exports = { query, getClient, pool }

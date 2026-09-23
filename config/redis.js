'use strict'

const Redis = require('ioredis')

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000)
    return delay
  },
  lazyConnect: false
}

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      return Math.min(times * 100, 3000)
    }
  })
  : new Redis(redisConfig)

redis.on('connect', () => {
  console.log(`[redis] Connected to Redis at ${redisConfig.host}:${redisConfig.port}`)
})

redis.on('ready', () => {
  console.log('[redis] Redis client is ready to accept commands')
})

redis.on('error', (err) => {
  console.error('[redis] Redis client error:', err.message)
})

redis.on('reconnecting', (time) => {
  console.log(`[redis] Reconnecting to Redis in ${time}ms...`)
})

module.exports = redis

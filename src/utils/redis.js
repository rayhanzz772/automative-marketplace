const crypto = require('crypto')
const redis = require('../../config/redis')

const isDev = process.env.NODE_ENV !== 'production'

const log = (...args) => {
  if (isDev) console.log(...args)
}

const MIN_TTL_SECONDS = 1
const CACHE_TIMEOUT_MS = 250
const BREAKER_COOLDOWN_MS = 5000

/* Pemutus arus. Timeout saja tidak cukup: satu request baca memanggil
   getVersions + getCache + setCacheWithTTL berurutan, jadi saat Redis mati tiap
   request membayar timeout tiga kali (~750ms) dan request tulis ~500ms. Begitu
   satu operasi gagal, cache dilewati sepenuhnya selama cooldown supaya request
   berikutnya langsung jatuh ke DB tanpa menunggu timeout lagi. */
let skipUntil = 0

function cacheSkipped() {
  return Date.now() < skipUntil
}

function tripBreaker() {
  skipUntil = Date.now() + BREAKER_COOLDOWN_MS
}

function withTimeout(promise, ms = CACHE_TIMEOUT_MS) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`redis cache op timeout after ${ms}ms`)), ms)
    if (typeof timer.unref === 'function') timer.unref()
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

const setCache = async (key, value) => {
  if (cacheSkipped()) return
  try {
    const todayEnd = Math.floor(new Date().setHours(23, 59, 59, 999) / 1000)
    const ttl = Math.max(MIN_TTL_SECONDS, todayEnd - Math.floor(Date.now() / 1000))
    await withTimeout(redis.set(key, JSON.stringify(value), 'EX', ttl))
    log(`Cache set for key: ${key}`)
  } catch (error) {
    tripBreaker()
    console.error(`Failed to set cache for key: ${key}`, error.message)
  }
}

const setCacheWithTTL = async (key, value, ttlSeconds) => {
  if (cacheSkipped()) return
  try {
    const ttl = Math.max(MIN_TTL_SECONDS, Math.floor(Number(ttlSeconds) || 0))
    await withTimeout(redis.set(key, JSON.stringify(value), 'EX', ttl))
    log(`Cache set with TTL for key: ${key}, ttl=${ttl}`)
  } catch (error) {
    tripBreaker()
    console.error(`Failed to set cache with TTL for key: ${key}`, error.message)
  }
}

const getCache = async (key) => {
  if (cacheSkipped()) return null
  try {
    const cachedValue = await withTimeout(redis.get(key))
    if (cachedValue) {
      return JSON.parse(cachedValue)
    } else {
      return null
    }
  } catch (error) {
    tripBreaker()
    console.error(`Failed to get cache for key: ${key}`, error.message)
    return null
  }
}

const delCache = async (key) => {
  if (cacheSkipped()) return false
  try {
    const removed = await withTimeout(redis.del(key))
    log(`Cache deleted for key: ${key}`)
    return removed > 0
  } catch (error) {
    tripBreaker()
    console.error(`Failed to delete cache for key: ${key}`, error.message)
    return false
  }
}

/* Invalidasi berbasis versi namespace.
   Key browse/search tak bisa didaftar satu per satu (kombinasi filter praktis tak
   terbatas), jadi invalidasi dilakukan dengan menaikkan nomor versi namespace.
   Versi ikut masuk ke dalam key, sehingga key lama langsung tak terpakai dan
   expire sendiri lewat TTL. Key versi sengaja tanpa TTL: kalau sempat expire lalu
   di-INCR lagi dari 0, key lama dari versi 0 bisa terpakai kembali. */
const VERSION_PREFIX = 'ver:'

async function getVersions(namespaces) {
  if (!namespaces.length) return []
  if (cacheSkipped()) return namespaces.map(() => '0')
  try {
    const values = await withTimeout(redis.mget(...namespaces.map((ns) => `${VERSION_PREFIX}${ns}`)))
    return namespaces.map((_, i) => (values && values[i]) || '0')
  } catch (error) {
    tripBreaker()
    console.error('Failed to read cache versions:', error.message)
    return namespaces.map(() => '0')
  }
}

async function invalidate(...namespaces) {
  if (cacheSkipped()) return
  for (const ns of namespaces) {
    try {
      const version = await withTimeout(redis.incr(`${VERSION_PREFIX}${ns}`))
      log(`Cache invalidated: namespace '${ns}' -> versi ${version}`)
    } catch (error) {
      tripBreaker()
      console.error(`Failed to invalidate cache namespace '${ns}':`, error.message)
      return
    }
  }
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = stableValue(value[key])
        return acc
      }, {})
  }
  return value
}

async function buildCacheKey(prefix, params = {}, namespaces = []) {
  const normalized = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      const value = params[key]
      if (value === undefined || value === null || value === '') return acc
      acc[key] = value
      return acc
    }, {})

  const hash = crypto
    .createHash('sha1')
    .update(JSON.stringify(stableValue(normalized)))
    .digest('hex')
    .slice(0, 16)

  if (!namespaces.length) return `${prefix}:${hash}`

  const sorted = [...namespaces].sort()
  const versions = await getVersions(sorted)
  return `${prefix}:${sorted.map((ns, i) => `${ns}${versions[i]}`).join('.')}:${hash}`
}

async function withCache(key, ttlSeconds, producer) {
  const cached = await getCache(key)
  if (cached !== null) return cached

  const fresh = await producer()
  if (fresh !== null && fresh !== undefined) {
    await setCacheWithTTL(key, fresh, ttlSeconds)
  }
  return fresh
}

module.exports = {
  setCache,
  setCacheWithTTL,
  getCache,
  delCache,
  buildCacheKey,
  withCache,
  invalidate
}

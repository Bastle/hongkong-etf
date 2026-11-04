interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl?: number
  stale?: boolean
}

const cache = new Map<string, CacheEntry<any>>()

const TRADING_CACHE_TTL = 5 * 1000 // 5 秒（短于前端轮询间隔 8s，确保拿到新数据）
const NON_TRADING_CACHE_TTL = 5 * 60 * 1000

/**
 * 判断是否在港股交易时间
 */
export function isTradingHours(): boolean {
  const now = new Date()
  // 转换为香港时间 (UTC+8)：直接加 8 小时，用 getUTCHours 避免本地时区干扰
  const hkTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const hours = hkTime.getUTCHours()
  const minutes = hkTime.getUTCMinutes()
  const time = hours * 60 + minutes

  // 上午盘：09:30 - 12:00
  if (time >= 570 && time <= 720) return true
  // 下午盘：13:00 - 16:10
  if (time >= 780 && time <= 970) return true
  // 收市竞价：16:10 - 16:20
  if (time >= 970 && time <= 980) return true

  return false
}

/**
 * 获取缓存
 * @param customTtl 自定义 TTL（毫秒），传入则覆盖默认的交易/非交易时段 TTL
 */
export function getCache<T>(key: string, customTtl?: number): T | null {
  const entry = cache.get(key)
  if (!entry) return null

  const ttl = customTtl ?? entry.ttl ?? (isTradingHours() ? TRADING_CACHE_TTL : NON_TRADING_CACHE_TTL)
  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(key)
    return null
  }

  return entry.data
}

/**
 * 设置缓存
 * @param customTtl 自定义 TTL（毫秒），传入则存储并在 getCache 时使用
 */
export function setCache<T>(key: string, data: T, options?: { stale?: boolean; ttl?: number }): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: options?.ttl,
    stale: options?.stale,
  })
}

/**
 * 获取过期缓存（用于 stale 回退，不删除过期 entry）
 */
export function getCacheStale<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  return entry.data
}

/**
 * 清除缓存
 */
export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}

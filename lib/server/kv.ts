import { Redis } from '@upstash/redis'

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  redis = Redis.fromEnv()
  return redis
}

/**
 * 从 KV 读取数据，无 Redis 环境时返回 null（优雅降级）
 */
export async function getKV<T>(key: string): Promise<T | null> {
  const client = getRedis()
  if (!client) return null
  try {
    return await client.get<T>(key)
  } catch {
    return null
  }
}

/**
 * 写入 KV，无 Redis 环境时跳过（优雅降级）
 * @param ttlSeconds 可选过期时间（秒）
 */
export async function setKV(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  const client = getRedis()
  if (!client) return
  try {
    if (ttlSeconds) {
      await client.set(key, value, { ex: ttlSeconds })
    } else {
      await client.set(key, value)
    }
  } catch {
    // 静默失败，不影响主流程
  }
}

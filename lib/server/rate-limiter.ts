interface TokenBucket {
  tokens: number
  lastRefill: number
  config: BucketConfig
}

interface BucketConfig {
  capacity: number
  refillRate: number
  minInterval: number
}

const buckets = new Map<string, TokenBucket>()

const BUCKET_CONFIGS: Record<string, BucketConfig> = {
  tencent: { capacity: 1, refillRate: 1000, minInterval: 3000 },
  sina: { capacity: 1, refillRate: 1000, minInterval: 3000 },
  eastmoney: { capacity: 2, refillRate: 1000, minInterval: 2000 },
}

const DEFAULT_CONFIG: BucketConfig = { capacity: 1, refillRate: 1000, minInterval: 3000 }

function getBucket(key: string): TokenBucket {
  if (!buckets.has(key)) {
    const config = BUCKET_CONFIGS[key] || DEFAULT_CONFIG
    buckets.set(key, {
      tokens: config.capacity,
      lastRefill: Date.now(),
      config,
    })
  }
  return buckets.get(key)!
}

export async function waitForToken(source: string): Promise<void> {
  const bucket = getBucket(source)
  const { config } = bucket
  const now = Date.now()

  const elapsed = now - bucket.lastRefill
  const tokensToAdd = Math.floor(elapsed / config.refillRate)
  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(config.capacity, bucket.tokens + tokensToAdd)
    bucket.lastRefill = now
  }

  if (bucket.tokens <= 0) {
    const waitTime = config.minInterval - (now - bucket.lastRefill)
    if (waitTime > 0) {
      await new Promise(r => setTimeout(r, waitTime))
    }
    bucket.tokens = config.capacity
    bucket.lastRefill = Date.now()
  }

  bucket.tokens--
}

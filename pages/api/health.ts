import type { NextApiRequest, NextApiResponse } from 'next'
import { getKV, setKV } from '@/lib/server/kv'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const redisEnabled = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

  let redisStatus: 'connected' | 'disabled' | 'error' = 'disabled'

  if (redisEnabled) {
    try {
      await setKV('health:ping', { ts: Date.now() }, 10)
      const result = await getKV<{ ts: number }>('health:ping')
      redisStatus = result ? 'connected' : 'error'
    } catch {
      redisStatus = 'error'
    }
  }

  res.status(200).json({
    status: 'ok',
    redis: redisStatus,
    timestamp: Date.now(),
  })
}

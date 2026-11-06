import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchIndices } from '@/lib/server/tencent'
import { getCache, setCache } from '@/lib/server/cache'
import type { IndexData } from '@/types/market'

const INDEX_NAMES: Record<string, string> = {
  HSI: '恒生指数',
  HSCCI: '恒生综合指数',
  HSTECH: '恒生科技指数',
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const cacheKey = 'indices'
  const cached = getCache<IndexData[]>(cacheKey)
  if (cached) {
    return res.json({ indices: cached, timestamp: Date.now() })
  }

  const rawData = await fetchIndices()
  const indices: IndexData[] = rawData
    .filter((s): s is typeof s & { code: string; price: number } => !!s.code && !!s.price)
    .map(s => ({
      code: s.code,
      name: INDEX_NAMES[s.code] ?? s.name,
      value: s.price,
      change: s.change ?? 0,
      changePercent: s.changePercent ?? 0,
    }))

  if (indices.length > 0) {
    setCache(cacheKey, indices)
  }

  res.json({ indices, timestamp: Date.now() })
}

import { fetchIndices } from '../../utils/tencent'
import { getCache, setCache } from '../../utils/cache'
import type { IndexData } from '~/types/market'

const INDEX_NAMES: Record<string, string> = {
  HSI: '恒生指数',
  HSCCI: '恒生综合指数',
  HSTECH: '恒生科技指数',
}

export default defineEventHandler(async () => {
  const cacheKey = 'indices'
  const cached = getCache<IndexData[]>(cacheKey)
  if (cached) {
    return { indices: cached, timestamp: Date.now() }
  }

  const rawData = await fetchIndices()
  const indices: IndexData[] = rawData
    .filter(s => s.code && s.price)
    .map(s => ({
      code: s.code,
      name: INDEX_NAMES[s.code] ?? s.name,
      value: s.price,
      change: s.change,
      changePercent: s.changePercent,
    }))

  if (indices.length > 0) {
    setCache(cacheKey, indices)
  }

  return { indices, timestamp: Date.now() }
})

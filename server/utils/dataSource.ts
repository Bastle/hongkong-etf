import type { HKStockQuote } from '../../app/types/market'
import { fetchStocksBatch } from './tencent'
import { fetchStocksSina } from './sina'
import { getCache, getCacheStale, setCache } from './cache'
import { waitForToken } from './rate-limiter'
import { normalizeTencentData as normalize } from '../../app/utils/normalization'

/**
 * 双源故障转移获取股票数据
 */
export async function fetchWithFallback(
  codes: string[],
  options: { source?: 'tencent' | 'sina' | 'auto' } = {}
): Promise<HKStockQuote[]> {
  const { source = 'auto' } = options
  const cacheKey = `stocks:${codes.sort().join(',')}`

  // 检查缓存
  const cached = getCache<HKStockQuote[]>(cacheKey)
  if (cached) return cached

  let stocks: HKStockQuote[] = []

  // 尝试主数据源（腾讯）
  if (source === 'auto' || source === 'tencent') {
    try {
      await waitForToken('tencent')
      const rawStocks = await fetchStocksBatch(codes)
      stocks = rawStocks
        .filter(s => s.code && s.price && s.price > 0)
        .map(s => normalize(s))
    } catch (err) {
      console.error('Tencent API failed:', err)
    }
  }

  // 腾讯失败，尝试新浪
  if (stocks.length === 0 && (source === 'auto' || source === 'sina')) {
    try {
      await waitForToken('sina')
      const rawStocks = await fetchStocksSina(codes)
      stocks = rawStocks
        .filter(s => s.code && s.price && s.price > 0)
        .map(s => ({
          ...normalize(s),
          source: 'sina' as const,
        }))
    } catch (err) {
      console.error('Sina API failed:', err)
    }
  }

  // 都失败，返回过期缓存（stale 回退）
  if (stocks.length === 0) {
    const staleCache = getCacheStale<HKStockQuote[]>(cacheKey)
    if (staleCache) {
      return staleCache.map(s => ({ ...s, timestamp: Date.now() }))
    }
  }

  // 设置缓存
  if (stocks.length > 0) {
    setCache(cacheKey, stocks)
  }

  return stocks
}

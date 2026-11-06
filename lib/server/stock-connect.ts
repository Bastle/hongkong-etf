import { getCache, setCache } from './cache'
import { waitForToken } from './rate-limiter'

const CACHE_KEY = 'stock-connect:list'
// 1 hour cache TTL for Stock Connect list
const CACHE_TTL = 60 * 60 * 1000

/**
 * 获取港股通标的列表
 * 数据源：东方财富 push2 API
 */
export async function getStockConnectList(): Promise<Set<string>> {
  const cached = getCache<Set<string>>(CACHE_KEY, CACHE_TTL)
  if (cached) return cached

  try {
    await waitForToken('eastmoney')

    const url = 'https://push2.eastmoney.com/api/qt/clist/get'
    const params = new URLSearchParams({
      pn: '1',
      pz: '2000',
      po: '1',
      np: '1',
      ut: 'bd1d9ddb04089700cf9c27f6f7426281',
      fltt: '2',
      invt: '2',
      fid: 'f3',
      fs: 'm:128+t:3,m:128+t:4', // 港股通标的（沪+深）
      fields: 'f12,f14', // f12=代码, f14=名称
    })

    const response = await fetch(`${url}?${params}`)
    const json = await response.json()

    const codes = new Set<string>()
    const diff = json?.data?.diff
    if (Array.isArray(diff)) {
      for (const item of diff) {
        if (item.f12) {
          codes.add(String(item.f12))
        }
      }
    }

    if (codes.size > 0) {
      setCache(CACHE_KEY, codes, { ttl: CACHE_TTL })
    }

    return codes
  } catch (e) {
    console.error('Failed to fetch Stock Connect list:', e)
    // 返回空集合，不阻塞功能
    return new Set<string>()
  }
}

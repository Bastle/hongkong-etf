import { getCache, setCache } from './cache'
import { waitForToken } from './rate-limiter'

const AGGREGATE_CACHE_KEY = 'southbound:aggregate'
const STOCKS_CACHE_KEY = 'southbound:stocks'
const CACHE_TTL = 60 * 1000 // 60 seconds

interface SouthboundAggregate {
  buy: number
  sell: number
  net: number
  date: string
}

interface SouthboundFlow {
  code: string
  name: string
  buy: number
  sell: number
  net: number
}

/**
 * 获取南向资金聚合数据（当日）
 * 数据源：东方财富 push2his API
 */
export async function fetchSouthboundAggregate(): Promise<SouthboundAggregate | null> {
  const cached = getCache<SouthboundAggregate>(AGGREGATE_CACHE_KEY, CACHE_TTL)
  if (cached) return cached

  try {
    await waitForToken('eastmoney')

    const url = 'https://push2his.eastmoney.com/api/qt/kamt.kline/get'
    const params = new URLSearchParams({
      fields1: 'f1,f2,f3,f4',
      fields2: 'f51,f52,f53,f54,f55,f56',
      klt: '101', // 日线
      lmt: '1',   // 最近 1 条
      ut: 'b2884a393a59ad64002292a3e90d46a5',
    })

    const response = await fetch(`${url}?${params}`)
    const json = await response.json()

    // 响应格式: { data: { s2n: [[date, buy, sell, net, ...], ...] } }
    const s2nData = json?.data?.s2n
    if (!Array.isArray(s2nData) || s2nData.length === 0) return null

    const latest = s2nData[s2nData.length - 1]
    const aggregate: SouthboundAggregate = {
      date: latest[0],
      buy: Number(latest[1]) || 0,
      sell: Number(latest[2]) || 0,
      net: Number(latest[3]) || 0,
    }

    setCache(AGGREGATE_CACHE_KEY, aggregate, { ttl: CACHE_TTL })
    return aggregate
  } catch (e) {
    console.error('Failed to fetch southbound aggregate:', e)
    return null
  }
}

/**
 * 获取南向资金个股数据（Top N）
 * 数据源：东方财富 datacenter API
 */
export async function fetchSouthboundStocks(limit = 100): Promise<SouthboundFlow[]> {
  const cached = getCache<SouthboundFlow[]>(STOCKS_CACHE_KEY, CACHE_TTL)
  if (cached) return cached

  try {
    await waitForToken('eastmoney')

    // 分别获取沪港通和深港通的数据
    const results: SouthboundFlow[] = []

    for (const mutualType of ['003', '006']) {
      const url = 'https://datacenter-web.eastmoney.com/api/data/v1/get'
      const params = new URLSearchParams({
        reportName: 'RPT_MUTUAL_DEAL_HISTORY',
        columns: 'ALL',
        filter: `(MUTUAL_TYPE="${mutualType}")`,
        pageNumber: '1',
        pageSize: String(limit),
        sortTypes: '-1',
        sortColumns: 'NET_BUY_AMT',
        source: 'WEB',
        client: 'WEB',
      })

      const response = await fetch(`${url}?${params}`)
      const json = await response.json()

      const diff = json?.result?.data
      if (Array.isArray(diff)) {
        for (const item of diff) {
          results.push({
            code: String(item.SECURITY_CODE || '').padStart(5, '0'),
            name: item.SECURITY_NAME_ABBR || '',
            buy: Number(item.BUY_AMT) || 0,
            sell: Number(item.SELL_AMT) || 0,
            net: Number(item.NET_BUY_AMT) || 0,
          })
        }
      }
    }

    // 按净买入金额排序，取 Top N
    results.sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
    const topStocks = results.slice(0, limit)

    if (topStocks.length > 0) {
      setCache(STOCKS_CACHE_KEY, topStocks, { ttl: CACHE_TTL })
    }

    return topStocks
  } catch (e) {
    console.error('Failed to fetch southbound stocks:', e)
    return []
  }
}

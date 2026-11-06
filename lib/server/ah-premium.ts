import { getCache, setCache } from './cache'
import { waitForToken } from './rate-limiter'
import { AH_PAIRS } from '../../data/ah-pairs'

const CACHE_KEY = 'ah-premium'
const CACHE_TTL = 30 * 1000 // 30 seconds

interface AHPremiumPair {
  hkCode: string
  hkName: string
  hkPrice: number
  aCode: string
  aName: string
  aPrice: number
  premium: number
  exchangeRate: number
}

/**
 * 获取 A 股价格
 * 复用腾讯 API 格式：sh600XXX / sz000XXX
 */
async function fetchASharePrices(codes: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>()
  if (codes.length === 0) return prices

  try {
    await waitForToken('tencent')
    const symbols = codes.join(',')
    const url = `http://qt.gtimg.cn/q=${symbols}`
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    const decoder = new TextDecoder('gbk')
    const text = decoder.decode(buffer)

    const lines = text.split(';').filter(line => line.includes('="'))
    for (const line of lines) {
      const match = line.match(/v_([a-z]{2}\d+)="(.+)"/)
      if (!match) continue
      const code = match[1]
      const fields = match[2].split('~')
      const price = parseFloat(fields[3])
      if (price > 0) {
        prices.set(code, price)
      }
    }
  } catch (e) {
    console.error('Failed to fetch A-share prices:', e)
  }

  return prices
}

/**
 * 获取港币兑人民币汇率
 * 使用腾讯外汇 API
 */
async function fetchExchangeRate(): Promise<number> {
  try {
    const url = 'http://qt.gtimg.cn/q=fx_susdcny'
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    const decoder = new TextDecoder('gbk')
    const text = decoder.decode(buffer)

    // 响应格式: v_fx_susdcny="..."
    const match = text.match(/="(.+)"/)
    if (match) {
      const fields = match[1].split('~')
      // 字段 1 是当前汇率
      const rate = parseFloat(fields[1])
      if (rate > 0) return rate
    }
  } catch (e) {
    console.error('Failed to fetch exchange rate:', e)
  }

  // 兜底汇率
  return 0.92
}

/**
 * 计算 AH 溢价
 */
export async function computeAHPremium(): Promise<AHPremiumPair[]> {
  const cached = getCache<AHPremiumPair[]>(CACHE_KEY, CACHE_TTL)
  if (cached) return cached

  // 获取所有 A 股代码
  const aCodes = AH_PAIRS.map(p => p.aCode)
  const [aPrices, exchangeRate] = await Promise.all([
    fetchASharePrices(aCodes),
    fetchExchangeRate(),
  ])

  const pairs: AHPremiumPair[] = AH_PAIRS.map(pair => {
    const aPrice = aPrices.get(pair.aCode) || 0
    // 港股价格需要从外部传入，这里先用 0 占位
    // 实际计算时会在 API 层合并
    return {
      ...pair,
      aPrice,
      hkPrice: 0,
      premium: 0,
      exchangeRate,
    }
  })

  setCache(CACHE_KEY, pairs, { ttl: CACHE_TTL })
  return pairs
}

/**
 * 获取完整 AH 溢价数据（包含港股价格）
 */
export async function getAHPremiumWithHKPrices(
  hkPrices: Map<string, number>
): Promise<AHPremiumPair[]> {
  const pairs = await computeAHPremium()

  return pairs.map(pair => {
    const hkPrice = hkPrices.get(pair.hkCode) || 0
    let premium = 0
    if (hkPrice > 0 && pair.aPrice > 0) {
      const aPriceInHKD = pair.aPrice / pair.exchangeRate
      premium = ((aPriceInHKD - hkPrice) / hkPrice) * 100
    }
    return { ...pair, hkPrice, premium }
  })
}

import { getAHPremiumWithHKPrices } from '../../utils/ah-premium'
import { fetchStocksBatch } from '../../utils/tencent'
import { waitForToken } from '../../utils/rate-limiter'
import { AH_PAIRS } from '../../data/ah-pairs'

export default defineEventHandler(async () => {
  // 获取港股价格
  const hkCodes = AH_PAIRS.map(p => p.hkCode)
  let hkPrices = new Map<string, number>()

  try {
    await waitForToken('tencent')
    const stocks = await fetchStocksBatch(hkCodes)
    for (const stock of stocks) {
      if (stock.code && stock.price && stock.price > 0) {
        hkPrices.set(stock.code, stock.price)
      }
    }
  } catch (e) {
    console.error('Failed to fetch HK prices for AH premium:', e)
  }

  const pairs = await getAHPremiumWithHKPrices(hkPrices)

  return {
    pairs,
    timestamp: Date.now(),
  }
})

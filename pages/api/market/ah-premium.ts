import type { NextApiRequest, NextApiResponse } from 'next'
import { getAHPremiumWithHKPrices } from '@/lib/server/ah-premium'
import { fetchStocksBatch } from '@/lib/server/tencent'
import { waitForToken } from '@/lib/server/rate-limiter'
import { AH_PAIRS } from '@/data/ah-pairs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  // 获取港股价格
  const hkCodes = AH_PAIRS.map(p => p.hkCode)
  const hkPrices = new Map<string, number>()

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

  res.json({
    pairs,
    timestamp: Date.now(),
  })
}

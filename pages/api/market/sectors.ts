import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchWithFallback } from '@/lib/server/data-source'
import { getAllStockCodes } from '@/lib/server/stock-list'
import { groupBySector } from '@/lib/server/sector-grouping'
import { getStockConnectList } from '@/lib/server/stock-connect'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  let codes = getAllStockCodes()

  // 港股通标的筛选
  if (req.query.stockConnect === 'true') {
    const eligibleCodes = await getStockConnectList()
    if (eligibleCodes.size > 0) {
      codes = codes.filter(c => eligibleCodes.has(c))
    }
  }

  const stocks = await fetchWithFallback(codes)
  const sectors = groupBySector(stocks)
  res.json(sectors)
}

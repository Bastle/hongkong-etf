import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchSouthboundAggregate, fetchSouthboundStocks } from '@/lib/server/southbound'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const [aggregate, stocks] = await Promise.all([
    fetchSouthboundAggregate(),
    fetchSouthboundStocks(100),
  ])

  res.json({
    aggregate: aggregate || { buy: 0, sell: 0, net: 0, date: '' },
    stocks,
    timestamp: Date.now(),
  })
}

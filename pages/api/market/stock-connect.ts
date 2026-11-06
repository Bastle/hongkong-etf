import type { NextApiRequest, NextApiResponse } from 'next'
import { getStockConnectList } from '@/lib/server/stock-connect'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const codes = await getStockConnectList()
  res.json({
    codes: Array.from(codes),
    count: codes.size,
    timestamp: Date.now(),
  })
}

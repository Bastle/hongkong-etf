import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchStocksBatch } from '@/lib/server/tencent'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const codesStr = req.query.codes as string

  if (!codesStr) {
    return res.status(400).json({ error: 'Missing required parameter: codes' })
  }

  const codes = codesStr.split(',').map(c => c.trim()).filter(Boolean)

  if (codes.length === 0) {
    return res.json([])
  }

  // 限制单次请求数量
  const batchSize = Math.min(codes.length, 50)
  const stocks = await fetchStocksBatch(codes.slice(0, batchSize))

  res.json(stocks)
}

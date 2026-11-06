import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchStocksBatch } from '@/lib/server/tencent'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const code = req.query.code as string

  if (!code) {
    return res.status(400).json({ error: 'Missing required parameter: code' })
  }

  const stocks = await fetchStocksBatch([code])

  if (stocks.length === 0) {
    return res.json({ code, name: '', price: 0, error: 'Stock not found' })
  }

  res.json(stocks[0])
}

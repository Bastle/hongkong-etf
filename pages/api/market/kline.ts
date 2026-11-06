import type { NextApiRequest, NextApiResponse } from 'next'
import { getCache, setCache } from '@/lib/server/cache'

interface KlineItem {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const code = req.query.code as string

  if (!code) {
    return res.status(400).json({ error: 'Missing required parameter: code' })
  }

  const cacheKey = `kline:${code}`
  const cached = getCache<KlineItem[]>(cacheKey)
  if (cached) {
    return res.json({ data: cached })
  }

  const symbol = `hk${code.padStart(5, '0')}`
  const url = `http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,,,240,qfq`

  try {
    const response = await fetch(url)
    const json = await response.json()

    const dayData = json?.data?.[symbol]?.day ?? json?.data?.[symbol]?.qfqday ?? []

    const data: KlineItem[] = dayData.map((item: any[]) => ({
      date: item[0],
      open: parseFloat(item[1]) || 0,
      high: parseFloat(item[2]) || 0,
      low: parseFloat(item[3]) || 0,
      close: parseFloat(item[4]) || 0,
      volume: parseFloat(item[5]) || 0,
    })).filter((item: KlineItem) => item.open > 0 && item.close > 0)

    if (data.length > 0) {
      setCache(cacheKey, data, { ttl: 60 * 1000 })
    }

    res.json({ data })
  } catch (e) {
    console.error('Failed to fetch kline data:', e)
    res.json({ data: [] })
  }
}

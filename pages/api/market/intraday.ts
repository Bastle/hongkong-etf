import type { NextApiRequest, NextApiResponse } from 'next'
import { getCache, setCache } from '@/lib/server/cache'
import { waitForToken } from '@/lib/server/rate-limiter'

interface IntradayPoint {
  time: string   // "0930"
  price: number
}

interface IntradayData {
  points: IntradayPoint[]
  prevClose: number
}

const INTRADAY_HOSTS = ['ifzq.gtimg.cn', 'web.ifzq.gtimg.cn']

/** 从腾讯分时接口获取当日分钟数据 */
async function fetchIntraday(code: string): Promise<IntradayData | null> {
  const symbol = `hk${code.padStart(5, '0')}`

  for (const host of INTRADAY_HOSTS) {
    try {
      await waitForToken('tencent')
      const url = `https://${host}/appstock/app/minute/query?code=${symbol}`
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const json = await response.json()

      const raw = json?.data?.[symbol]?.data?.data
      if (!raw || !Array.isArray(raw) || raw.length === 0) continue

      // 数据行格式: "0930 421.000 823895 346860688.000"
      const points: IntradayPoint[] = raw
        .map((row: string) => {
          const parts = row.split(' ')
          return {
            time: parts[0],
            price: parseFloat(parts[1]) || 0,
          }
        })
        .filter((p: IntradayPoint) => p.price > 0)

      // 前收盘价：从行情快照中取（qt.{symbol} 数组的第 4 个字段）
      const qt = json?.data?.[symbol]?.qt?.[symbol]
      const prevClose = qt ? parseFloat(qt[4]) || 0 : 0

      if (points.length > 0) {
        return { points, prevClose }
      }
    } catch (e) {
      console.error(`Failed to fetch intraday from ${host}:`, e)
    }
  }

  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const code = req.query.code as string
  if (!code) {
    return res.status(400).json({ error: 'Missing required parameter: code' })
  }

  const cacheKey = `intraday:${code}`
  const cached = getCache<IntradayData>(cacheKey)
  if (cached) {
    return res.json({ data: cached })
  }

  const data = await fetchIntraday(code)
  if (data) {
    setCache(cacheKey, data, { ttl: 60 * 1000 })
    return res.json({ data })
  }

  res.json({ data: null })
}
